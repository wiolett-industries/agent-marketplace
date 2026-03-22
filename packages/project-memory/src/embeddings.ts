import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  client = new OpenAI({ apiKey });
  return client;
}

/**
 * Returns embedding vector, or [] if OPENAI_API_KEY is not set.
 * Entries without embeddings still work via keyword (FTS5) search.
 */
export async function embed(text: string): Promise<number[]> {
  const c = getClient();
  if (!c) return [];
  const response = await c.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}
