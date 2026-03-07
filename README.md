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

Register this repo as a local marketplace and install:

```bash
/plugin marketplace add /Users/knownout/Claude/claude-project-memory
/plugin install project-memory@local
```

Then run the setup command once to configure the MCP server:

```
/memory-setup sk-proj-your-openai-key
```

That's it. Restart Claude Code and the `project-memory` tools will be available.

### Manual installation

1. Install dependencies:
   ```bash
   cd /path/to/claude-project-memory && npm install
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

- Node.js 22.5+ (uses built-in `node:sqlite`)
- OpenAI API key (for embeddings — keyword search still works without it)

## Storage

Memory is stored in `.memory/memory.db` relative to the **project root** (the directory Claude Code opens). Each project gets its own isolated memory database.

## Architecture

- **Runtime:** TypeScript / Node.js (run directly via `tsx`, no build step)
- **Storage:** SQLite via `node:sqlite` (Node.js built-in, no native compilation)
- **Embeddings:** OpenAI `text-embedding-3-small`
- **Search:** Cosine similarity (weight 0.7) + FTS5 BM25 (weight 0.3), both normalized to [0,1]
