import { getEntryById, getDb, deleteEntryFromDb } from '../db.js';
import { deleteEntryFile } from '../files.js';

export function handleDelete(args: { id: string }): { deleted: boolean } {
  const entry = getEntryById(args.id);
  if (!entry) return { deleted: false };

  // If deep entry, also delete its lite pointer file
  if (entry.layer === 'deep') {
    const pointer = getDb().prepare("SELECT id FROM entries WHERE ref = ?").get(args.id) as unknown as { id: string } | undefined;
    if (pointer) deleteEntryFile(pointer.id);
  }

  deleteEntryFile(args.id);
  const deleted = deleteEntryFromDb(args.id); // cascades lite pointer in DB too
  return { deleted };
}
