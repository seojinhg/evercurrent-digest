const cron = require('node-cron');
const aiService = require('./ai.service');
const silenceService = require('./silence.service');
const threadService = require('./thread.service');
const vectorService = require('./vector.service');
const messages = require('../data/slack-messages.json');
const tickets = require('../data/jira-tickets.json');
const rolePhaseContext = require('../data/role-phase-context.json');

// In-memory store for scheduled digests
// In production: replace with Redis or PostgreSQL
const scheduledDigests = {};

const ROLES = [
  'Mechanical Engineer',
  'Electrical Engineer',
  'Supply Chain',
  'Engineering Manager',
  'Product Manager'
];

const CHANNEL_MAP = {
  'Mechanical Engineer': ['#mechanical', '#general'],
  'Electrical Engineer': ['#electrical', '#general'],
  'Supply Chain': ['#supply-chain', '#general'],
  'Engineering Manager': ['#mechanical', '#electrical', '#supply-chain', '#general', '#product'],
  'Product Manager': ['#general', '#product']
};

async function generateScheduledDigest(role, phase, project = 'Atlas Arm v2') {
  try {
    const roleContext = rolePhaseContext[role]?.[phase];
    if (!roleContext) return null;

    const subscribedChannels = CHANNEL_MAP[role] || ['#general'];

    // Filter tickets
    const relevantTickets = tickets
      .filter(t => t.status !== 'Done')
      .filter(t => t.phase === phase)
      .filter(t => subscribedChannels.includes(t.related_channel))
      .sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      })
      .slice(0, 8);

    // Filter messages
    const now = new Date('2026-05-06T12:00:00');
    const cutoff = new Date(now - 24 * 60 * 60 * 1000);

    const relevantMessages = messages.filter(msg => {
      const msgTime = new Date(msg.timestamp);
      const isWeekend = msgTime.getDay() === 0 || msgTime.getDay() === 6;
      if (isWeekend) {
        const relatedTicket = tickets.find(t => t.ticket_id === msg.related_ticket);
        if (!relatedTicket || relatedTicket.priority !== 'Critical') return false;
      }
      if (msgTime < cutoff) return false;
      return subscribedChannels.includes(msg.channel);
    });

    // Group by thread
    const threadMap = {};
    relevantMessages.forEach(msg => {
      if (!msg.thread_id) {
        threadMap[`solo-${msg.message_id}`] = [msg];
      } else {
        if (!threadMap[msg.thread_id]) threadMap[msg.thread_id] = [];
        threadMap[msg.thread_id].push(msg);
      }
    });

    // Summarize threads
    const threadSummaries = [];
    for (const [threadId, threadMessages] of Object.entries(threadMap)) {
      try {
        const summary = threadMessages.length === 1
          ? threadMessages[0].content
          : await threadService.summarize(threadId, threadMessages);

        threadSummaries.push({
          thread_id: threadId,
          channel: threadMessages[0].channel,
          related_ticket: threadMessages[0].related_ticket,
          summary,
          message_count: threadMessages.length
        });
      } catch (err) {
        console.error(`Scheduled digest thread summarization failed: ${err.message}`);
      }
    }

    // Vector search
    const userQuery = roleContext.priority_keywords.join(' ');
    const vectorResults = await vectorService.searchSimilar(userQuery, role, phase, 10);

    const relevantTicketIds = new Set(
      vectorResults.filter(r => r.type === 'jira').map(r => r.id)
    );
    const relevantMessageIds = new Set(
      vectorResults.filter(r => r.type === 'slack').map(r => r.id)
    );

    const finalThreads = threadSummaries
      .filter(t => {
        const msgs = relevantMessages.filter(m => m.thread_id === t.thread_id);
        return msgs.some(m => relevantMessageIds.has(m.message_id));
      })
      .slice(0, 8);

    const threadsToUse = finalThreads.length > 0
      ? finalThreads
      : threadSummaries.slice(0, 5);

    const boostedTickets = [
      ...relevantTickets.filter(t => relevantTicketIds.has(t.ticket_id)),
      ...relevantTickets.filter(t => !relevantTicketIds.has(t.ticket_id))
    ].slice(0, 8);

    // Silence alerts
    const silenceAlerts = silenceService.detectSilence(
      relevantTickets,
      messages,
      { ignoreWeekends: false }
    );

    // Build prompt
    const systemPrompt = `You are EverCurrent, a Daily Digest generator for a robotics hardware engineering team.

Your job is to generate a personalized morning digest for a ${role} working on ${project} in the ${phase} phase.

ROLE CONTEXT:
- Focus areas: ${roleContext.focus.join(', ')}
- Priority keywords: ${roleContext.priority_keywords.join(', ')}
- Perspective: ${roleContext.prompt_context}

INSTRUCTIONS:
1. Analyze the Slack thread summaries and Jira tickets provided
2. Surface only what is relevant to this person's role and phase
3. Maximum 4 sections total — keep responses concise
4. Prioritize: silence alerts → critical tickets → high tickets → relevant messages
5. Each section must have specific actionable items
6. Be concise and direct
9. REQUIRED: Every section MUST include related_messages array with at least 1 message from thread_summaries

OUTPUT FORMAT (strict JSON only, no markdown, no backticks):
{
  "greeting": "Good morning [role] — one sentence about today's focus",
  "summary": "2 sentence executive summary",
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
          "slack_url": "slack_url field from original message if available"
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

    const userContext = {
      role,
      phase,
      project,
      priorities: roleContext.priority_keywords
    };

    const dataPayload = {
      silence_alerts: silenceAlerts,
      jira_tickets: boostedTickets,
      thread_summaries: threadsToUse
    };

    const digest = await aiService.generateDigest(systemPrompt, userContext, dataPayload);

    return {
      generated_at: new Date().toISOString(),
      user_context: userContext,
      digest
    };

  } catch (err) {
    console.error(`Scheduled digest failed for ${role}/${phase}: ${err.message}`);
    return null;
  }
}

async function runDailyDigest() {
  console.log(`[Scheduler] Running daily digest generation — ${new Date().toISOString()}`);

  const defaultPhase = 'Validation';

  for (const role of ROLES) {
    try {
      console.log(`[Scheduler] Generating digest for ${role}...`);
      const result = await generateScheduledDigest(role, defaultPhase);

      if (result) {
        const cacheKey = `${role}-${defaultPhase}`;
        scheduledDigests[cacheKey] = result;
        console.log(`[Scheduler] ✅ Digest ready for ${role}`);
      }
    } catch (err) {
      console.error(`[Scheduler] ❌ Failed for ${role}: ${err.message}`);
    }
  }

  console.log(`[Scheduler] Daily digest generation complete`);
}

function getScheduledDigest(role, phase) {
  const cacheKey = `${role}-${phase}`;
  const cached = scheduledDigests[cacheKey];

  if (!cached) return null;

  // Check if digest is from today
  const cachedDate = new Date(cached.generated_at).toDateString();
  const today = new Date().toDateString();

  if (cachedDate !== today) {
    delete scheduledDigests[cacheKey];
    return null;
  }

  return cached;
}

function startScheduler() {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * 1-5', async () => {
    await runDailyDigest();
  }, {
    timezone: 'America/Los_Angeles'
  });

  console.log('[Scheduler] Daily digest scheduler started — runs at 8:00 AM PST (Mon-Fri)');
}

module.exports = { startScheduler, getScheduledDigest, runDailyDigest };