# Project Memory — Claude Code Plugin

Persistent, searchable memory for Claude Code, scoped per project. Stores context in a local SQLite database with hybrid semantic + keyword search powered by OpenAI embeddings.

## Two-Layer Design

| Layer | Purpose | Access |
|-------|---------|--------|
| `light` | High-priority context, always loaded | `memory_read_light()` |
| `deep` | Full knowledge store, searched on demand | `memory_search(query)` |

## MCP Tools

| Tool | Description |
|------|-------------|
| `memory_write` | Store an entry (content + optional tags + layer) |
| `memory_read_light` | Return all light entries instantly |
| `memory_search` | Hybrid semantic+keyword search over deep entries |
| `memory_delete` | Delete an entry by ID |
| `memory_read_all` | Return all entries (no embeddings) |

## Installation

### As a Claude Code plugin (recommended)

```bash
/plugin marketplace add knownout/claude-project-memory
/plugin install project-memory@knownout
```

Then run the setup command once to configure the MCP server globally:

```
/memory-setup sk-proj-your-openai-key
```

Restart Claude Code — the `project-memory` tools will be available in every session.

### Manual installation

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/knownout/claude-project-memory.git
   cd claude-project-memory && npm install
   ```

2. Add to `~/.claude/mcp.json`:
   ```json
   {
     "mcpServers": {
       "project-memory": {
         "command": "node",
         "args": ["--import", "tsx/esm", "--no-warnings", "/path/to/claude-project-memory/src/index.ts"],
         "env": {
           "OPENAI_API_KEY": "sk-..."
         }
       }
     }
   }
   ```

3. Restart Claude Code.

## Requirements

- Node.js 22.5+ (uses built-in `node:sqlite` — no native compilation)
- OpenAI API key (for embeddings — keyword-only fallback works without it)

## How it works

Claude automatically calls `memory_read_light()` at the start of each session to load your project context. When you need to dig deeper, `memory_search(query)` runs a hybrid search: 70% semantic similarity (OpenAI embeddings) + 30% BM25 keyword match, both normalized and merged.

The included `using-project-memory` skill teaches Claude *when* to save — external tool workflows, deployment steps, credentials you provide, errors and their fixes.

## Storage

Memory lives in `.memory/memory.db` relative to the project root (the directory Claude Code opens). Each project gets its own isolated database. The `.memory/` directory is gitignored by default.

## Architecture

- **Runtime:** TypeScript / Node.js via `tsx` (no build step)
- **Storage:** `node:sqlite` (Node.js 22.5+ built-in)
- **Embeddings:** OpenAI `text-embedding-3-small`
- **Search:** Cosine similarity (0.7) + FTS5 BM25 (0.3), normalized to [0,1]
