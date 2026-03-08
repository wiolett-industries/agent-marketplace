import { nanoid } from 'nanoid';
import { upsertEntry, getDeepEntries, getLiteEntries } from '../db.js';
import { writeEntryFile, contentHash } from '../files.js';
import { embed } from '../embeddings.js';

export async function handleWrite(args: {
  content: string;
  tags?: string[];
  layer?: 'lite' | 'deep';
  summary?: string;
}): Promise<{ id: string; pointer_id?: string; action: 'created' | 'updated' }> {
  const { content, tags = [], layer = 'deep', summary } = args;
  const now = Date.now();

  if (layer === 'lite') {
    // Manual lite entry (standalone fact, no deep counterpart)
    const existing = getLiteEntries().find(e => e.content === content);
    const id = existing?.id ?? nanoid();
    const embedding = await embed(content);
    const entry = { id, content, tags, layer: 'lite' as const, ref: null, embedding, created_at: existing?.created_at ?? now, updated_at: now };
    writeEntryFile(entry);
    upsertEntry(entry, contentHash(content));
    return { id, action: existing ? 'updated' : 'created' };
  }

  // Deep entry — save full content, auto-create lite pointer
  const existingDeep = getDeepEntries().find(e => e.content === content);
  const deepId = existingDeep?.id ?? nanoid();
  const embedding = await embed(content);
  const deepEntry = { id: deepId, content, tags, layer: 'deep' as const, ref: null, embedding, created_at: existingDeep?.created_at ?? now, updated_at: now };

  writeEntryFile(deepEntry);
  upsertEntry(deepEntry, contentHash(content));

  // Build lite pointer content from summary or truncated content
  const pointerText = summary ?? (content.length > 160 ? content.slice(0, 157) + '...' : content);
  const pointerContent = `[→ ${deepId}] ${pointerText}`;

  // Upsert lite pointer (match by ref to avoid duplicates on update)
  const existingPointer = getLiteEntries().find(e => e.ref === deepId);
  const pointerId = existingPointer?.id ?? nanoid();
  const pointerEntry = { id: pointerId, content: pointerContent, tags, layer: 'lite' as const, ref: deepId, embedding: [], created_at: existingPointer?.created_at ?? now, updated_at: now };

  writeEntryFile(pointerEntry);
  upsertEntry(pointerEntry, contentHash(pointerContent));

  return { id: deepId, pointer_id: pointerId, action: existingDeep ? 'updated' : 'created' };
}
