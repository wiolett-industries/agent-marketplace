import { getEntryById } from '../db.js';
import type { Entry } from '../db.js';

type EntryWithoutEmbedding = Omit<Entry, 'embedding'>;

export function handleGet(args: { id: string }): EntryWithoutEmbedding | null {
  const entry = getEntryById(args.id);
  if (!entry) return null;
  const { embedding: _e, ...rest } = entry;
  return rest;
}
