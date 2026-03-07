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
/project-memory:memory-setup sk-proj-your-openai-key
```

Restart Claude Code. The `project-memory` MCP tools will be active for that project.

Repeat `/project-memory:memory-setup` in each project where you want memory enabled.

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

Remove `.mcp.json` entries from any projects where you ran `/project-memory:memory-setup`.

---

## How it works

### Two-layer design

| Layer | Role | Size |
|-------|------|------|
| `light` | Short pointers to deep memories + critical always-needed facts | 1 sentence per entry |
| `deep` | All actual content — detailed, fully searchable | No limit |

At session start the `SessionStart` hook automatically injects two things into Claude's context:

1. **Light layer** — your pointers and critical facts
2. **Deep topic index** — all tags from deep entries, showing what's searchable

This keeps context lean regardless of how much is stored. Claude knows what exists and fetches only what's needed via `memory_search`.

### Example session context (what Claude sees on startup)

```
## Always-loaded context (light layer)
- Deep memory: full deployment workflow available (search: deploy, gitlab)
- Deep memory: MinIO upload commands (search: minio, uploads)
- Active stack: Next.js frontend, FastAPI backend, PostgreSQL

## Deep memory topics — call memory_search(topic) to load details
credentials, deploy, gitlab, minio, pipeline, postgresql, uploads
```

### Saving a memory (the pointer pattern)

Always save full detail to `deep`, then a 1-sentence pointer to `light`:

```
# Full content → deep
memory_write("Deploy: git push origin main, tag vX.Y.Z, push tag, check GitLab pipeline list_pipelines(project_id=42)", tags=["deploy","gitlab"], layer="deep")

# Pointer → light
memory_write("Deep memory: deployment workflow via GitLab CI (search: deploy, gitlab)", tags=["deploy"], layer="light")
```

### Search

`memory_search` uses hybrid scoring: 70% cosine similarity (OpenAI embeddings) + 30% BM25 keyword match, both normalized to [0,1].

## MCP Tools

| Tool | Description |
|------|-------------|
| `memory_write` | Store an entry. Default layer: `deep`. Use `light` only for 1-sentence pointers or critical facts. |
| `memory_read_light` | Return all light entries (already injected by hook at session start). |
| `memory_search` | Hybrid semantic+keyword search over deep entries. |
| `memory_delete` | Delete an entry by ID. |
| `memory_read_all` | Return all entries from both layers (no embeddings). |

## Storage

Memory lives in `.memory/memory.db` relative to the project root. Each project has its own isolated database. `.memory/` is gitignored by default.

## Architecture

- **Runtime:** TypeScript via bundled `tsx` (no build step)
- **Storage:** `node:sqlite` (Node.js 22.5+ built-in)
- **Embeddings:** OpenAI `text-embedding-3-small`
- **Search:** Cosine similarity (0.7) + FTS5 BM25 (0.3)
- **Session hook:** `SessionStart` injects light layer + deep topic index before first message
