import { getDeepEntries, searchFTS } from '../db.js';
import { embed } from '../embeddings.js';
import { cosineSimilarity } from '../utils/cosine.js';
import { normalizeScores } from '../utils/normalize.js';
import type { Entry } from '../db.js';

type SearchResult = Omit<Entry, 'embedding'> & { score: number };

export async function handleSearch(args: {
  query: string;
  limit?: number;
}): Promise<SearchResult[]> {
  const { query, limit = 10 } = args;

  const entries = getDeepEntries();
  if (entries.length === 0) return [];

  // Semantic scores
  const queryEmbedding = await embed(query);
  const semanticRaw = new Map<string, number>();
  for (const entry of entries) {
    if (entry.embedding.length > 0) {
      semanticRaw.set(entry.id, cosineSimilarity(queryEmbedding, entry.embedding));
    }
  }

  // Keyword scores via FTS5
  let keywordNorm = new Map<string, number>();
  try {
    const ftsScores = searchFTS(query, 'deep');
    keywordNorm = normalizeScores(ftsScores);
  } catch {
    // FTS query may fail on special chars — fall back to semantic only
  }

  const semanticNorm = normalizeScores(semanticRaw);

  // Merge scores: 0.7 semantic + 0.3 keyword
  const combined = new Map<string, number>();
  for (const entry of entries) {
    const sem = semanticNorm.get(entry.id) ?? 0;
    const kw = keywordNorm.get(entry.id) ?? 0;
    combined.set(entry.id, 0.7 * sem + 0.3 * kw);
  }

  const entryMap = new Map(entries.map(e => [e.id, e]));

  return Array.from(combined.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, score]) => {
      const { embedding: _e, ...rest } = entryMap.get(id)!;
      return { ...rest, score };
    });
}
