#!/usr/bin/env node
// Initializes the project-memory storage directories and SQLite database.
// Usage: node scripts/init-db.js <project-dir>

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const projectDir = process.argv[2];
if (!projectDir) {
  console.error('Usage: node scripts/init-db.js <project-dir>');
  process.exit(1);
}

const memoryDir = join(projectDir, '.memory');
const entriesDir = join(memoryDir, 'entries');
const dbPath = join(memoryDir, 'memory.db');
const gitignorePath = join(projectDir, '.gitignore');

// Create directories
mkdirSync(entriesDir, { recursive: true });

// Initialize SQLite schema (DB is rebuilt from files on startup, but we create it now
// so the hook can read from it immediately after setup)
const db = new DatabaseSync(dbPath);
db.prepare(`
  CREATE TABLE IF NOT EXISTS entries (
    id         TEXT PRIMARY KEY,
    content    TEXT NOT NULL,
    tags       TEXT NOT NULL DEFAULT '[]',
    layer      TEXT NOT NULL DEFAULT 'deep',
    ref        TEXT DEFAULT NULL,
    hash       TEXT DEFAULT NULL,
    embedding  TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`).run();
db.prepare(`
  CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
    content, tags,
    content='entries',
    content_rowid='rowid'
  )
`).run();
db.close();

// Update .gitignore:
// - Remove old '.memory/' blanket ignore if present
// - Add '.memory/memory.db' (only ignore the DB, not the entry files)
const dbIgnoreEntry = '.memory/memory.db';
const oldIgnoreEntry = '.memory/';

if (existsSync(gitignorePath)) {
  const lines = readFileSync(gitignorePath, 'utf8').split('\n');
  const alreadyHasDb = lines.some(l => l.trim() === dbIgnoreEntry);
  if (alreadyHasDb) {
    console.log(`project-memory: initialized at ${memoryDir}`);
    process.exit(0);
  }
  // Remove old blanket ignore, add specific DB ignore
  const filtered = lines.filter(l => l.trim() !== oldIgnoreEntry);
  filtered.push(dbIgnoreEntry, '');
  writeFileSync(gitignorePath, filtered.join('\n'), 'utf8');
} else {
  appendFileSync(gitignorePath, `${dbIgnoreEntry}\n`);
}

console.log(`project-memory: initialized at ${memoryDir}`);
console.log(`project-memory: .memory/entries/ will be tracked by git (share memories with your team)`);
console.log(`project-memory: .memory/memory.db is gitignored (rebuilt from files on startup)`);
