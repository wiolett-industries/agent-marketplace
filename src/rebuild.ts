import { existsSync } from 'node:fs';
import { getDb, getDbPath, upsertEntry, getEntryHash, getAllDbIds } from './db.js';
import { getEntriesDir, listEntryIds, readEntryFile, writeEntryFile, contentHash, type EntryFile } from './files.js';

/**
 * If an old-style DB exists with entries but no files have been created yet,
 * export all DB entries to files so they become the source of truth.
 */
function migrateOldDbToFiles(): void {
  const dbPath = getDbPath();
  if (!existsSync(dbPath)) return;

  const fileIds = listEntryIds();
  if (fileIds.length > 0) return; // files already exist, nothing to migrate

  const db = getDb();
  const rows = db.prepare('SELECT * FROM entries').all() as unknown as {
    id: string; content: string; tags: string; layer: string;
    ref: string | null; embedding: string; created_at: number; updated_at: number;
  }[];

  if (rows.length === 0) return;

  process.stderr.write(`[project-memory] migrating ${rows.length} entries from DB to files...\n`);

  for (const row of rows) {
    const entry: EntryFile = {
      id: row.id,
      content: row.content,
      tags: JSON.parse(row.tags) as string[],
      layer: row.layer as 'lite' | 'deep',
      ref: row.ref ?? null,
      embedding: JSON.parse(row.embedding) as number[],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
    writeEntryFile(entry);
  }

  process.stderr.write(`[project-memory] migration complete.\n`);
}

/**
 * Rebuild the DB from files on startup.
 * - Files with changed content (hash mismatch) are re-upserted.
 * - Files that are new are inserted.
 * - DB rows with no corresponding file are deleted.
 * Embeddings come from files — no OpenAI calls needed.
 */
export function rebuildFromFiles(): void {
  // Ensure entries dir exists
  getEntriesDir();

  // Migrate old DB entries to files if needed
  migrateOldDbToFiles();

  const fileIds = listEntryIds();
  const fileIdSet = new Set(fileIds);

  // Upsert files that are new or changed
  for (const id of fileIds) {
    const entry = readEntryFile(id);
    if (!entry) continue;

    const hash = contentHash(entry.content);
    const storedHash = getEntryHash(id);

    if (storedHash === hash) continue; // unchanged

    upsertEntry({
      id: entry.id,
      content: entry.content,
      tags: entry.tags,
      layer: entry.layer,
      ref: entry.ref,
      embedding: entry.embedding,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    }, hash);
  }

  // Remove DB rows whose files were deleted
  const dbIds = getAllDbIds();
  const db = getDb();
  for (const id of dbIds) {
    if (!fileIdSet.has(id)) {
      db.prepare("DELETE FROM entries WHERE ref = ?").run(id);
      db.prepare("DELETE FROM entries WHERE id = ?").run(id);
    }
  }
}
