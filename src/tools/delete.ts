import { deleteEntry } from '../db.js';

export function handleDelete(args: { id: string }): { deleted: boolean } {
  return { deleted: deleteEntry(args.id) };
}
