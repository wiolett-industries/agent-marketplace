import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export interface EntryFile {
  id: string;
  content: string;
  tags: string[];
  layer: 'lite' | 'deep';
  ref: string | null;
  embedding: number[];
  created_at: number;
  updated_at: number;
}

export function getEntriesDir(): string {
  const dir = path.join(process.cwd(), '.memory', 'entries');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function contentHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function writeEntryFile(entry: EntryFile): void {
  const file = path.join(getEntriesDir(), `${entry.id}.json`);
  writeFileSync(file, JSON.stringify(entry, null, 2), 'utf8');
}

export function readEntryFile(id: string): EntryFile | null {
  const file = path.join(getEntriesDir(), `${id}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8')) as EntryFile;
}

export function deleteEntryFile(id: string): void {
  const file = path.join(getEntriesDir(), `${id}.json`);
  if (existsSync(file)) unlinkSync(file);
}

export function listEntryIds(): string[] {
  const dir = getEntriesDir();
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.slice(0, -5));
}
