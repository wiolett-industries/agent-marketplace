import { deleteEntry } from '../db.js';

export function handleDelete(args: { id: string }): { deleted: boolean } {
  // deleteEntry cascades — also removes the light pointer that refs this id
  return { deleted: deleteEntry(args.id) };
}
