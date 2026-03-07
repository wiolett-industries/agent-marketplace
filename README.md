# Project Memory — Claude Code Plugin

Persistent, searchable memory for Claude Code, scoped per project. Stores context in a local SQLite database with hybrid semantic + keyword search powered by OpenAI embeddings.

## Requirements

| Dependency | Version | Notes |
|-----------|---------|-------|
| [Node.js](https://nodejs.org) | 22.5+ | Uses built-in `node:sqlite` — no native compilation needed |
| [Claude Code](https://claude.ai/code) | latest | Plugin host |
| OpenAI API key | — | For semantic embeddings. Keyword search still works without it. |

## Installation

### Plugin (recommended)

```
/plugin marketplace add knownout/claude-project-memory
/plugin install --scope user project-memory@knownout
```

Then enable memory for your project — run this from the project root:

```
/memory-setup sk-proj-your-openai-key
```

Restart Claude Code. The `project-memory` MCP tools will be active for that project.

Repeat `/memory-setup` in each project where you want memory enabled.

### Manual

1. Clone and install:
   ```bash
   git clone https://github.com/knownout/claude-project-memory.git
   cd claude-project-memory && npm install
   ```

2. Add to your project's `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "project-memory": {
         "command": "/path/to/claude-project-memory/node_modules/.bin/tsx",
         "args": ["/path/to/claude-project-memory/src/index.ts"],
         "env": {
           "OPENAI_API_KEY": "sk-..."
         }
       }
     }
   }
   ```

3. Restart Claude Code.

## Uninstall

```
/plugin uninstall project-memory@knownout
```

Remove `.mcp.json` entries from any projects where you ran `/memory-setup`.

---

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

## How it works

At the start of every session Claude calls `memory_read_light()` to load project context, then searches deep memory for the topic at hand. The included `using-project-memory` skill defines exactly when to read and save — external tool workflows, deployment steps, credentials you provide, errors and their fixes.

`memory_search` uses hybrid scoring: 70% cosine similarity (OpenAI embeddings) + 30% BM25 keyword match, both normalized to [0,1].

## Storage

Memory lives in `.memory/memory.db` relative to the project root. Each project has its own isolated database. `.memory/` is gitignored by default.

## Architecture

- **Runtime:** TypeScript via bundled `tsx` (no build step)
- **Storage:** `node:sqlite` (Node.js 22.5+ built-in)
- **Embeddings:** OpenAI `text-embedding-3-small`
- **Search:** Cosine similarity (0.7) + FTS5 BM25 (0.3)
