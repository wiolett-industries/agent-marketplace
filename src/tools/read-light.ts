import { getLightEntries } from '../db.js';
import type { Entry } from '../db.js';

type EntryWithoutEmbedding = Omit<Entry, 'embedding'>;

export function handleReadLight(): EntryWithoutEmbedding[] {
  return getLightEntries().map(({ embedding: _e, ...rest }) => rest);
}
