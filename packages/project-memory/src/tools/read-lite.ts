import { getLiteEntries } from '../db.js';
import type { Entry } from '../db.js';

type EntryWithoutEmbedding = Omit<Entry, 'embedding'>;

export function handleReadLite(): EntryWithoutEmbedding[] {
  return getLiteEntries().map(({ embedding: _e, ...rest }) => rest);
}
