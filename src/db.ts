import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export interface Entry {
  id: string;
  content: string;
  tags: string[];
  layer: 'lite' | 'deep';
  ref: string | null;       // lite pointer entries: ID of the deep entry they point to
  embedding: number[];
  created_at: number;
  updated_at: number;
}

interface RawEntry {
  id: string;
  content: string;
  tags: string;
  layer: string;
  ref: string | null;
  embedding: string;
  created_at: number;
  updated_at: number;
}

interface FTSResult {
  id: string;
  rank: number;
}

let dbInstance: DatabaseSync | null = null;

function getDbPath(): string {
  const cwd = process.cwd();
  const memoryDir = path.join(cwd, '.memory');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
  return path.join(memoryDir, 'memory.db');
}

function runDDL(database: DatabaseSync, sql: string): void {
  database.prepare(sql).run();
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  dbInstance = new DatabaseSync(getDbPath());
  dbInstance.prepare('PRAGMA journal_mode = WAL').run();

  runDDL(dbInstance, `
    CREATE TABLE IF NOT EXISTS entries (
      id         TEXT PRIMARY KEY,
      content    TEXT NOT NULL,
      tags       TEXT NOT NULL DEFAULT '[]',
      layer      TEXT NOT NULL DEFAULT 'deep',
      ref        TEXT DEFAULT NULL,
      embedding  TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Migration: add ref column to existing DBs that don't have it
  const cols = dbInstance.prepare("PRAGMA table_info(entries)").all() as unknown as { name: string }[];
  if (!cols.some(c => c.name === 'ref')) {
    runDDL(dbInstance, 'ALTER TABLE entries ADD COLUMN ref TEXT DEFAULT NULL');
  }

  // Migration: rename layer value 'light' -> 'lite' for existing DBs
  dbInstance.prepare("UPDATE entries SET layer = 'lite' WHERE layer = 'light'").run();

  runDDL(dbInstance, `
    CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
      content,
      tags,
      content='entries',
      content_rowid='rowid'
    )
  `);

  runDDL(dbInstance, `
    CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
      INSERT INTO entries_fts(rowid, content, tags) VALUES (new.rowid, new.content, new.tags);
    END
  `);

  runDDL(dbInstance, `
    CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
      INSERT INTO entries_fts(entries_fts, rowid, content, tags) VALUES ('delete', old.rowid, old.content, old.tags);
    END
  `);

  runDDL(dbInstance, `
    CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
      INSERT INTO entries_fts(entries_fts, rowid, content, tags) VALUES ('delete', old.rowid, old.content, old.tags);
      INSERT INTO entries_fts(rowid, content, tags) VALUES (new.rowid, new.content, new.tags);
    END
  `);

  return dbInstance;
}

function parseEntry(raw: RawEntry): Entry {
  return {
    ...raw,
    tags: JSON.parse(raw.tags) as string[],
    layer: raw.layer as 'lite' | 'deep',
    ref: raw.ref ?? null,
    embedding: JSON.parse(raw.embedding) as number[],
  };
}

export function upsertEntry(entry: Entry): void {
  const database = getDb();
  const existing = database.prepare('SELECT id FROM entries WHERE id = ?').get(entry.id) as unknown as { id: string } | undefined;

  if (existing) {
    database.prepare(`
      UPDATE entries SET content = ?, tags = ?, layer = ?, ref = ?, embedding = ?, updated_at = ?
      WHERE id = ?
    `).run(
      entry.content,
      JSON.stringify(entry.tags),
      entry.layer,
      entry.ref ?? null,
      JSON.stringify(entry.embedding),
      entry.updated_at,
      entry.id
    );
  } else {
    database.prepare(`
      INSERT INTO entries (id, content, tags, layer, ref, embedding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.content,
      JSON.stringify(entry.tags),
      entry.layer,
      entry.ref ?? null,
      JSON.stringify(entry.embedding),
      entry.created_at,
      entry.updated_at
    );
  }
}

export function getEntryById(id: string): Entry | null {
  const database = getDb();
  const row = database.prepare('SELECT * FROM entries WHERE id = ?').get(id) as unknown as RawEntry | undefined;
  return row ? parseEntry(row) : null;
}

export function deleteEntry(id: string): boolean {
  const database = getDb();
  // Cascade: also delete any lite pointer that references this deep entry
  database.prepare("DELETE FROM entries WHERE ref = ?").run(id);
  const result = database.prepare('DELETE FROM entries WHERE id = ?').run(id);
  return (result.changes as number) > 0;
}

export function getLiteEntries(): Entry[] {
  const database = getDb();
  const rows = database.prepare("SELECT * FROM entries WHERE layer = 'lite' ORDER BY updated_at DESC").all() as unknown as RawEntry[];
  return rows.map(parseEntry);
}

export function getDeepEntries(): Entry[] {
  const database = getDb();
  const rows = database.prepare("SELECT * FROM entries WHERE layer = 'deep' ORDER BY updated_at DESC").all() as unknown as RawEntry[];
  return rows.map(parseEntry);
}

export function getAllEntries(): Omit<Entry, 'embedding'>[] {
  const database = getDb();
  const rows = database.prepare('SELECT id, content, tags, layer, ref, created_at, updated_at FROM entries ORDER BY updated_at DESC').all() as unknown as Omit<RawEntry, 'embedding'>[];
  return rows.map(raw => ({
    ...raw,
    tags: JSON.parse(raw.tags) as string[],
    layer: raw.layer as 'lite' | 'deep',
    ref: raw.ref ?? null,
  }));
}

export function searchFTS(query: string, layer: 'deep' | 'lite' = 'deep'): Map<string, number> {
  const database = getDb();
  const results = database.prepare(`
    SELECT e.id, -fts.rank AS rank
    FROM entries_fts fts
    JOIN entries e ON e.rowid = fts.rowid
    WHERE entries_fts MATCH ? AND e.layer = ?
    ORDER BY rank DESC
  `).all(query, layer) as unknown as FTSResult[];

  const scores = new Map<string, number>();
  for (const row of results) {
    scores.set(row.id, row.rank);
  }
  return scores;
}
