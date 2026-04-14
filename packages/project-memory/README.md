# Project Memory for Codex and MCP Hosts

Persistent, searchable project memory for Codex and other MCP-capable agents. Memories are stored as JSON files committed to git, and a local SQLite database is rebuilt from those files on startup for fast hybrid semantic and keyword search.

## Requirements

| Dependency | Version | Notes |
|-----------|---------|-------|
| [Node.js](https://nodejs.org) | 22.5+ | Uses built-in `node:sqlite` — no native compilation needed |
| Codex or another MCP host | latest | Optional plugin host |
| OpenAI API key | — | For semantic embeddings. Optional — keyword search works without it. Teammates can load existing embeddings from git without a key. |

## Installation

### Codex Plugin (recommended)

Install the `project-memory` plugin from this repo's Codex marketplace, then enable memory for the current project from the project root:

```
project-memory:memory-setup sk-proj-your-openai-key
```

The setup command installs package dependencies, initializes `.memory/`, writes a project-local `.mcp.json`, and adds `.mcp.json` to `.gitignore` if needed.

Repeat the setup command in each project where you want memory enabled.

### Manual MCP Setup

1. Clone and install:
   ```bash
   git clone https://github.com/wiolett-industries/agent-marketplace.git
   cd agent-marketplace/packages/project-memory && npm install
   ```

2. Add to your project's `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "project-memory": {
         "command": "/path/to/agent-marketplace/packages/project-memory/node_modules/.bin/tsx",
         "args": ["/path/to/agent-marketplace/packages/project-memory/src/index.ts"],
         "env": {
           "OPENAI_API_KEY": "sk-..."
         }
       }
     }
   }
   ```

3. If you are using the Codex plugin, the bundled hook will inject lite memory automatically once the database exists. Manual MCP-only installs still get all memory tools but do not get plugin-managed hooks.

---

## Why Project Memory?

Most host-local memory features store facts on one machine for one user.

Project Memory is built around two ideas: team sharing and context efficiency.

**Shared team memory.** Memory files live in `.memory/entries/` inside your project and are committed to git. Every teammate gets the same memories after a `git pull` — deployment workflows, credentials, architecture decisions, project conventions. No more re-explaining the same things in every new session or on every machine.

**Lite and deep layers.** Not all memories need to be loaded all the time. Deep entries hold full detail — long commands, full workflows, code snippets. Lite entries are one-sentence pointers to deep ones. Only lite pointers are injected at session start, keeping context lean. When the agent needs the full detail, it fetches the specific deep entry by ID.

**Searchable on demand.** Deep memories are searched with hybrid semantic and keyword scoring. The agent can find the right memory even without knowing the exact wording or tag.

**Transparent.** Every entry is a plain JSON file you can read, edit, or delete directly. Embeddings are stored alongside content — teammates without an OpenAI API key can still load and search all existing memories after a `git pull`.

---

## How it works

### Two-layer design

| Layer | Role | Size |
|-------|------|------|
| `lite` | Short pointers to deep memories + critical always-needed facts | 1 sentence per entry |
| `deep` | All actual content — detailed, fully searchable | No limit |

At session start the `UserPromptSubmit` hook automatically injects two things into the conversation context (once per session):

1. **Lite layer** — your pointers and critical facts
2. **Deep topic index** — all tags from deep entries, showing what's searchable

This keeps context lean regardless of how much is stored. The agent knows what exists and fetches only what's needed via `memory_get` or `memory_search`.

### Example session context

```
## Lite memory (always loaded)
- [→ abc123] Deployment workflow via GitLab CI [deploy, gitlab]
- [→ def456] MinIO upload commands [minio, uploads]
- Active stack: Next.js frontend, FastAPI backend, PostgreSQL

## Deep memory topics — use memory_get(id) or memory_search(topic)
credentials, deploy, gitlab, minio, pipeline, postgresql, uploads
```

### Saving a memory

`memory_write` handles everything in one call — saves full content to `deep` and auto-creates a 1-sentence lite pointer:

```
memory_write(
  content="Deploy: git push origin main, tag vX.Y.Z, push tag, check GitLab pipeline list_pipelines(project_id=42)",
  tags=["deploy", "gitlab"],
  summary="Deployment workflow via GitLab CI"
)
```

### Search

`memory_search` uses hybrid scoring: 70% cosine similarity (OpenAI embeddings) + 30% BM25 keyword match, both normalized to [0,1].

## MCP Tools

| Tool | Description |
|------|-------------|
| `memory_write` | Store an entry. Default layer: `deep`. Use `lite` only for 1-sentence standalone facts. |
| `memory_get` | Fetch full content of a deep entry by ID (from a lite pointer). |
| `memory_read_lite` | Return all lite entries (already injected by hook at session start). |
| `memory_search` | Hybrid semantic+keyword search over deep entries. |
| `memory_delete` | Delete an entry by ID. |
| `memory_read_all` | Return all entries from both layers (no embeddings). |

## Storage & Team Sharing

```
.memory/
  entries/        ← committed to git (source of truth)
    <id>.json     ← one file per memory entry (content + embedding)
  memory.db*      ← gitignored (db + WAL sidecars), rebuilt from files on startup
```

Each entry file contains full content, tags, layer, embedding, and timestamps. Because embeddings are stored in the files, teammates can `git pull` and get fully functional semantic search without an OpenAI API key.

**Write flow:** file written first → DB updated. A crash between the two is self-healing — the next startup rebuild picks up the file.

**Migration:** if you have an older DB-only setup, the server automatically exports all entries to files on first startup.

## Architecture

- **Runtime:** TypeScript via bundled `tsx` (no build step)
- **Storage:** JSON files (source of truth) + `node:sqlite` cache (Node.js 22.5+ built-in)
- **Embeddings:** OpenAI `text-embedding-3-small` (stored in files, not recomputed unless content changes)
- **Search:** Cosine similarity (0.7) + FTS5 BM25 (0.3)
- **Session hook:** `UserPromptSubmit` injects lite layer + deep topic index once per session
