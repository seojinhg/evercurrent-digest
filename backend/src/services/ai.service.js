const Anthropic = require('@anthropic-ai/sdk');

const AI_PROVIDER = process.env.AI_PROVIDER || 'claude';

let anthropicClient = null;

function getClient() {
  if (AI_PROVIDER === 'claude') {
    if (!anthropicClient) {
      anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    return anthropicClient;
  }
  throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
}

async function complete(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (AI_PROVIDER === 'claude') {
        const client = getClient();
        const response = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('');

        if (!text || text.length < 10) {
          throw new Error('Response too short');
        }

        return text;
      }
    } catch (err) {
      console.error(`AI call attempt ${attempt} failed:`, err.message);

      if (attempt === retries) {
        throw new Error(`AI service failed after ${retries} attempts: ${err.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function generateDigest(systemPrompt, userContext, data) {
  const prompt = `${systemPrompt}

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

DATA:
${JSON.stringify(data, null, 2)}

Return ONLY valid JSON. No markdown, no explanation. No backticks.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const client = getClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: 'You are a JSON generator. You must return only valid JSON with no markdown, no backticks, no explanation. Raw JSON only.',
        messages: [{ role: 'user', content: prompt }]
      });

      const raw = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

      const cleaned = raw
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON object found in response');

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error('Invalid digest structure');
      }

      parsed.sections = parsed.sections.slice(0, 5);

      return parsed;

    } catch (err) {
      console.error(`Digest generation attempt ${attempt} failed:`, err.message);

      if (attempt === 3) {
        return {
          greeting: 'Good morning',
          summary: 'Unable to generate digest at this time. Please try again.',
          sections: [],
          silence_alerts: []
        };
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

module.exports = { complete, generateDigest };