#!/usr/bin/env node
// Initializes the project-memory SQLite database in the target project directory.
// Usage: node scripts/init-db.js <project-dir>

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const projectDir = process.argv[2];
if (!projectDir) {
  console.error('Usage: node scripts/init-db.js <project-dir>');
  process.exit(1);
}

const memoryDir = join(projectDir, '.memory');
const dbPath = join(memoryDir, 'memory.db');
const gitignorePath = join(projectDir, '.gitignore');

// Create .memory/ directory
mkdirSync(memoryDir, { recursive: true });

// Initialize schema
const db = new DatabaseSync(dbPath);
db.prepare(`
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
`).run();
db.prepare(`
  CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
    content, tags,
    content='entries',
    content_rowid='rowid'
  )
`).run();
db.close();

// Add .memory/ to .gitignore if not already present
const gitignoreEntry = '.memory/';
let alreadyIgnored = false;
if (existsSync(gitignorePath)) {
  const contents = readFileSync(gitignorePath, 'utf8');
  alreadyIgnored = contents.split('\n').some(line => line.trim() === gitignoreEntry);
}
if (!alreadyIgnored) {
  appendFileSync(gitignorePath, `\n${gitignoreEntry}\n`);
}

console.log(`project-memory: database initialized at ${dbPath}`);
