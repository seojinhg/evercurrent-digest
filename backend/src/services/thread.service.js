const aiService = require('./ai.service');

const cache = {};
const CACHE_TTL_HOURS = 24;

function getCache(threadId, messages) {
  const cached = cache[threadId];
  if (!cached) return null;

  const now = new Date();
  const cachedAt = new Date(cached.cached_at);
  const hoursDiff = (now - cachedAt) / (1000 * 60 * 60);

  if (hoursDiff > CACHE_TTL_HOURS) {
    delete cache[threadId];
    return null;
  }

  const lastMessageTime = messages.reduce((latest, msg) => {
    const msgTime = new Date(msg.timestamp);
    return msgTime > latest ? msgTime : latest;
  }, new Date(0));

  if (lastMessageTime > new Date(cached.cached_at)) {
    delete cache[threadId];
    return null;
  }

  return cached;
}

function setCache(threadId, summary, messages) {
  cache[threadId] = {
    thread_id: threadId,
    summary,
    message_count: messages.length,
    cached_at: new Date().toISOString()
  };
}

function getAllCache() {
  return cache;
}

async function summarize(threadId, messages) {
  try {
    if (messages.length === 0) {
      throw new Error('No messages to summarize');
    }

    const formatted = messages
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(msg => `[${msg.sender} - ${msg.sender_role}]: ${msg.content}`)
      .join('\n');

    const prompt = `You are summarizing a Slack thread for a robotics hardware engineering team.
    
Summarize the following thread in 2-3 sentences. Focus on:
- What is being discussed
- Any decisions made or actions required
- Any blockers or risks mentioned

Be concise and factual. Do not add opinions.

Thread:
${formatted}

Return only the summary text, no additional formatting.`;

    const summary = await aiService.complete(prompt);

    if (!summary || summary.length < 10) {
      throw new Error('Summary too short, likely failed');
    }

    setCache(threadId, summary, messages);

    return summary;

  } catch (err) {
    const fallback = messages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    return fallback
      ? `Latest: ${fallback.content}`
      : 'Thread summary unavailable';
  }
}

module.exports = { summarize, getCache, getAllCache };