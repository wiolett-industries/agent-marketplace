import { getAllEntries } from '../db.js';
import type { Entry } from '../db.js';

type EntryWithoutEmbedding = Omit<Entry, 'embedding'>;

export function handleReadAll(): EntryWithoutEmbedding[] {
  return getAllEntries();
}
