import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export interface Entry {
  id: string;
  content: string;
  tags: string[];
  layer: 'light' | 'deep';
  embedding: number[];
  created_at: number;
  updated_at: number;
}

interface RawEntry {
  id: string;
  content: string;
  tags: string;
  layer: string;
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
      embedding  TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

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
    layer: raw.layer as 'light' | 'deep',
    embedding: JSON.parse(raw.embedding) as number[],
  };
}

export function upsertEntry(entry: Entry): void {
  const database = getDb();
  const existing = database.prepare('SELECT id FROM entries WHERE id = ?').get(entry.id) as unknown as { id: string } | undefined;

  if (existing) {
    database.prepare(`
      UPDATE entries SET content = ?, tags = ?, layer = ?, embedding = ?, updated_at = ?
      WHERE id = ?
    `).run(
      entry.content,
      JSON.stringify(entry.tags),
      entry.layer,
      JSON.stringify(entry.embedding),
      entry.updated_at,
      entry.id
    );
  } else {
    database.prepare(`
      INSERT INTO entries (id, content, tags, layer, embedding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.content,
      JSON.stringify(entry.tags),
      entry.layer,
      JSON.stringify(entry.embedding),
      entry.created_at,
      entry.updated_at
    );
  }
}

export function deleteEntry(id: string): boolean {
  const database = getDb();
  const result = database.prepare('DELETE FROM entries WHERE id = ?').run(id);
  return (result.changes as number) > 0;
}

export function getLightEntries(): Entry[] {
  const database = getDb();
  const rows = database.prepare("SELECT * FROM entries WHERE layer = 'light' ORDER BY updated_at DESC").all() as unknown as RawEntry[];
  return rows.map(parseEntry);
}

export function getDeepEntries(): Entry[] {
  const database = getDb();
  const rows = database.prepare("SELECT * FROM entries WHERE layer = 'deep' ORDER BY updated_at DESC").all() as unknown as RawEntry[];
  return rows.map(parseEntry);
}

export function getAllEntries(): Omit<Entry, 'embedding'>[] {
  const database = getDb();
  const rows = database.prepare('SELECT id, content, tags, layer, created_at, updated_at FROM entries ORDER BY updated_at DESC').all() as unknown as Omit<RawEntry, 'embedding'>[];
  return rows.map(raw => ({
    ...raw,
    tags: JSON.parse(raw.tags) as string[],
    layer: raw.layer as 'light' | 'deep',
  }));
}

export function searchFTS(query: string, layer: 'deep' | 'light' = 'deep'): Map<string, number> {
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
