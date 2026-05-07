const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const silenceService = require('../services/silence.service');
const threadService = require('../services/thread.service');
const messages = require('../data/slack-messages.json');
const tickets = require('../data/jira-tickets.json');
const rolePhaseContext = require('../data/role-phase-context.json');
const vectorService = require('../services/vector.service');

const digestCache = {};

// GET /api/digest/cache
router.get('/cache', (req, res) => {
  try {
    const { role, phase } = req.query;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const cacheKey = `${role}-${phase || 'Design'}`;
    const cached = digestCache[cacheKey];

    if (!cached) {
      return res.status(404).json({
        success: false,
        error: 'No cached digest found'
      });
    }

    const cachedDate = new Date(cached.generated_at).toDateString();
    const today = new Date().toDateString();

    if (cachedDate !== today) {
      delete digestCache[cacheKey];
      return res.status(404).json({
        success: false,
        error: 'Cached digest is from a previous day'
      });
    }

    res.json({
      success: true,
      from_cache: true,
      ...cached
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cached digest',
      message: err.message
    });
  }
});

// POST /api/digest
router.post('/', async (req, res) => {
  try {
    const { role, current_phase, project, priorities } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required',
        message: 'Please select your role to continue'
      });
    }

    const phase = current_phase || 'Design';
    const roleContext = rolePhaseContext[role]?.[phase];

    if (!roleContext) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role or phase combination'
      });
    }
    // Step 2 — Define channel map and subscribed channels
    const channelMap = {
      'Mechanical Engineer': ['#mechanical', '#general'],
      'Electrical Engineer': ['#electrical', '#general'],
      'Supply Chain': ['#supply-chain', '#general'],
      'Engineering Manager': ['#mechanical', '#electrical', '#supply-chain', '#general', '#product'],
      'Product Manager': ['#general', '#product']
    };

    const subscribedChannels = channelMap[role] || ['#general'];
    const userName = req.body.name || null;

    // Step 3 — Filter tickets with N-person handling and cost optimization
    const relevantTickets = tickets
      .filter(t => t.status !== 'Done')
      .filter(t => t.phase === phase)
      .filter(t => {
        if (userName) {
          // show own tickets + critical + subscribed channel tickets
          return (
            t.assignee === userName ||
            t.priority === 'Critical' ||
            subscribedChannels.includes(t.related_channel)
          );
        }
        // fallback: subscribed channel tickets only
        return subscribedChannels.includes(t.related_channel);
      })
      .sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      })
      .slice(0, 8); // limit to 8 tickets to reduce LLM token cost

    // Step 4 — Filter messages with mention priority boost
    // TEMP for mock data testing — replace with new Date() in production
    const now = process.env.NODE_ENV === 'production'
      ? new Date()
      : new Date('2026-05-06T12:00:00');
    const cutoff = new Date(now - 24 * 60 * 60 * 1000);

    const relevantMessages = messages
      .filter(msg => {
        const msgTime = new Date(msg.timestamp);
        const isWeekend = msgTime.getDay() === 0 || msgTime.getDay() === 6;
        if (isWeekend) {
          const relatedTicket = tickets.find(t => t.ticket_id === msg.related_ticket);
          if (!relatedTicket || relatedTicket.priority !== 'Critical') return false;
        }
        if (msgTime < cutoff) return false;
        return subscribedChannels.includes(msg.channel);
      })
      .map(msg => ({
        ...msg,
        // boost messages where user is mentioned
        boosted: userName && msg.mentions.includes(userName)
      }))
      .sort((a, b) => {
        // sort boosted messages to top, then by timestamp
        if (a.boosted && !b.boosted) return -1;
        if (!a.boosted && b.boosted) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

    // Step 5 — Group messages by thread
    const threadMap = {};
    relevantMessages.forEach(msg => {
      if (!msg.thread_id) {
        threadMap[`solo-${msg.message_id}`] = [msg];
      } else {
        if (!threadMap[msg.thread_id]) threadMap[msg.thread_id] = [];
        threadMap[msg.thread_id].push(msg);
      }
    });
    
    // Step 5a - Summarize threads 
    const threadSummaries = [];
    for (const [threadId, threadMessages] of Object.entries(threadMap)) {
      try {
        let summary;
        if (threadMessages.length === 1) {
          summary = threadMessages[0].content;
        } else {
          summary = await threadService.summarize(threadId, threadMessages);
        }
        threadSummaries.push({
          thread_id: threadId,
          channel: threadMessages[0].channel,
          related_ticket: threadMessages[0].related_ticket,
          summary,
          message_count: threadMessages.length,
          latest_timestamp: threadMessages
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp
        });
      } catch (err) {
        console.error(`Thread summarization failed for ${threadId}:`, err.message);
      }
    }

    // vector search — no LLM call, cheap similarity matching
    const userQuery = [
      ...(priorities || []),
      ...(roleContext.priority_keywords || [])
    ].join(' ');

    const vectorResults = await vectorService.searchSimilar(
      userQuery,
      role,
      phase,
      10
    );

    const relevantTicketIds = new Set(
      vectorResults
        .filter(r => r.type === 'jira')
        .map(r => r.id)
    );

    const relevantMessageIds = new Set(
      vectorResults
        .filter(r => r.type === 'slack')
        .map(r => r.id)
    );

    // prioritize vector-matched threads
    const finalThreads = threadSummaries
      .filter(t => {
        const msgs = relevantMessages.filter(
          m => m.thread_id === t.thread_id
        );
        return msgs.some(m => relevantMessageIds.has(m.message_id));
      })
      .slice(0, 8);

    // fallback if no vector matches
    const threadsToUse = finalThreads.length > 0
      ? finalThreads
      : threadSummaries.slice(0, 5);

    // boost vector-matched tickets to top
    const boostedTickets = [
      ...relevantTickets.filter(t => relevantTicketIds.has(t.ticket_id)),
      ...relevantTickets.filter(t => !relevantTicketIds.has(t.ticket_id))
    ].slice(0, 8);

    // Step 5b — Detect silence alerts
    const silenceAlerts = silenceService.detectSilence(
      relevantTickets,
      messages,
      { ignoreWeekends: false }
    );

    // Step 5c — Build system prompt
const systemPrompt = `You are EverCurrent, a Daily Digest generator for a robotics hardware engineering team.

Your job is to generate a personalized morning digest for a ${role} working on ${project || 'Atlas Arm v2'} in the ${phase} phase.

ROLE CONTEXT:
- Focus areas: ${roleContext.focus.join(', ')}
- Priority keywords: ${roleContext.priority_keywords.join(', ')}
- Perspective: ${roleContext.prompt_context}

INSTRUCTIONS:
1. Analyze the Slack thread summaries and Jira tickets provided
2. Surface only what is relevant to this person's role and phase
3. Group related information into clear sections
4. Maximum 5 sections total
5. Prioritize: silence alerts → critical tickets → high tickets → relevant messages
6. Each section must have specific actionable items
7. Be concise and direct — this person reads this in the morning
8. Weekend Critical alerts must always be included regardless of day
9. REQUIRED: Every section MUST include related_messages array with at least 1 message from thread_summaries that supports the section content. Never leave related_messages empty.

PRIORITY KEYWORDS TO WATCH: ${priorities && priorities.length > 0 ? priorities.join(', ') : roleContext.priority_keywords.join(', ')}

OUTPUT FORMAT (strict JSON only, no markdown, no backticks):
{
  "greeting": "Good morning [role] — one sentence about today's focus",
  "summary": "2 sentence executive summary of what matters most today",
  "sections": [
  {
      "title": "section title",
      "icon": "tabler icon name",
      "priority": "critical|high|medium|low",
      "body": "2-3 sentences of relevant insight",
      "actions": ["specific action 1", "specific action 2"],
      "related_messages": [
        {
          "sender": "sender name",
          "channel": "#channel-name",
          "content": "original message content",
          "slack_url": "slack://channel"
        }
      ]
    }
  ],
  "silence_alerts": [
    {
      "ticket_id": "ticket id",
      "message": "alert message",
      "severity": "Critical|High|Medium"
    }
  ]
}`;

    // Step 6 — User context
    const userContext = {
      role,
      phase,
      project: project || 'Atlas Arm v2',
      priorities: priorities || roleContext.priority_keywords
    };

    // Step 7 — Data payload
    const dataPayload = {
      silence_alerts: silenceAlerts,
      jira_tickets: boostedTickets,
      thread_summaries: threadsToUse,
      mention_alerts: relevantMessages
        .filter(m => m.boosted)
        .slice(0, 3)
        .map(m => ({
          channel: m.channel,
          sender: m.sender,
          content: m.content,
          timestamp: m.timestamp
        }))
    };

    // Step 8 — Generate digest
    const digest = await aiService.generateDigest(
      systemPrompt,
      userContext,
      dataPayload
    );

    // Step 9 — Merge silence alerts
    if (silenceAlerts.length > 0 && digest.silence_alerts.length === 0) {
      digest.silence_alerts = silenceAlerts.map(alert => ({
        ticket_id: alert.ticket_id,
        message: alert.message,
        severity: alert.severity
      }));
    }

    // Step 10 — cache save
    const cacheKey = `${role}-${phase}`;
    digestCache[cacheKey] = {
      generated_at: new Date().toISOString(),
      user_context: userContext,
      digest
    };

    res.json({
      success: true,
      generated_at: new Date().toISOString(),
      user_context: userContext,
      digest
    });

  } catch (err) {
    console.error('Digest generation error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate digest',
      message: err.message
    });
  }
});

module.exports = router;