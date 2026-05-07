const { LocalIndex } = require('vectra');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const index = new LocalIndex(
  path.join(__dirname, '../data/vector-index')
);

async function getEmbedding(text) {
  // Use a simple hash-based pseudo embedding for prototype
  // In production: use real embedding API (OpenAI text-embedding-3-small)
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(384).fill(0);

  words.forEach((word, i) => {
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash * 31 + word.charCodeAt(c)) % 384;
    }
    vector[hash] += 1 / (i + 1);
  });

  // Normalize vector
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

async function initIndex() {
  try {
    if (!await index.isIndexCreated()) {
      await index.createIndex({ version: 1, deleteIfExists: true });
      console.log('Vector index created');
    }
  } catch (err) {
    console.error('Vector index init failed:', err.message);
  }
}

async function indexMessages(messages) {
  try {
    await initIndex();

    for (const msg of messages) {
      const text = `${msg.channel} ${msg.sender_role} ${msg.content}`;
      const vector = await getEmbedding(text);

      await index.upsertItem({
        vector,
        metadata: {
          id: msg.message_id,
          channel: msg.channel,
          sender: msg.sender,
          sender_role: msg.sender_role,
          content: msg.content,
          timestamp: msg.timestamp,
          related_ticket: msg.related_ticket,
          thread_id: msg.thread_id,
          type: 'slack'
        }
      });
    }

    console.log(`Indexed ${messages.length} messages`);
  } catch (err) {
    console.error('Message indexing failed:', err.message);
  }
}

async function indexTickets(tickets) {
  try {
    await initIndex();

    for (const ticket of tickets) {
      const text = `${ticket.title} ${ticket.description} ${ticket.assignee_role} ${ticket.priority}`;
      const vector = await getEmbedding(text);

      await index.upsertItem({
        vector,
        metadata: {
          id: ticket.ticket_id,
          title: ticket.title,
          assignee: ticket.assignee,
          assignee_role: ticket.assignee_role,
          priority: ticket.priority,
          status: ticket.status,
          due_date: ticket.due_date,
          phase: ticket.phase,
          related_channel: ticket.related_channel,
          type: 'jira'
        }
      });
    }

    console.log(`Indexed ${tickets.length} tickets`);
  } catch (err) {
    console.error('Ticket indexing failed:', err.message);
  }
}

async function searchSimilar(query, role, phase, topK = 10) {
  try {
    await initIndex();

    const contextQuery = `${role} ${phase} ${query}`;
    const vector = await getEmbedding(contextQuery);

    const results = await index.queryItems(vector, topK);

    // filter by score threshold and limit to topK
    const filtered = results
      .filter(r => r.score > 0.1)
      .slice(0, topK)
      .map(r => ({
        ...r.item.metadata,
        score: r.score
      }));

    return filtered;

  } catch (err) {
    console.error('Vector search failed:', err.message);
    return [];
  }
}

async function buildIndex(messages, tickets) {
  await initIndex();
  await indexMessages(messages);
  await indexTickets(tickets);
  console.log('Vector index build complete');
}

module.exports = { buildIndex, searchSimilar, initIndex };