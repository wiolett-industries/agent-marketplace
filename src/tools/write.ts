import { nanoid } from 'nanoid';
import { upsertEntry, getDeepEntries, getLightEntries } from '../db.js';
import { embed } from '../embeddings.js';

export async function handleWrite(args: {
  content: string;
  tags?: string[];
  layer?: 'light' | 'deep';
}): Promise<{ id: string; action: 'created' | 'updated' }> {
  const { content, tags = [], layer = 'deep' } = args;

  // Check if an entry with the same content already exists (upsert by content match)
  const existing = layer === 'light'
    ? getLightEntries().find(e => e.content === content)
    : getDeepEntries().find(e => e.content === content);

  const id = existing?.id ?? nanoid();
  const now = Date.now();
  const embedding = await embed(content);

  upsertEntry({
    id,
    content,
    tags,
    layer,
    embedding,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  });

  return { id, action: existing ? 'updated' : 'created' };
}
