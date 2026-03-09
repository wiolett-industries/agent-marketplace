---
name: using-project-memory
description: Use at every conversation start and after completing any task involving external tools, deployments, uploads, pipelines, credentials, tokens, or project-specific workflows
---

# Using Project Memory

## Overview

Two layers, one write call:

| Layer | Role |
|-------|------|
| `deep` | Full content — all details, fully searchable |
| `lite` | Auto-created pointer to a deep entry, containing its ID |

`memory_write` always saves to deep and automatically creates a lite pointer. You never need to write to both layers manually.

## Session Start

The hook has already injected into your context:
1. **Lite memory** — pointers like `[→ abc123] Translations workflow...` plus any standalone facts
2. **Deep topic index** — all tags from deep entries

Read these before doing anything. When a pointer is relevant, call `memory_get(id)` to load the full content.

## Writing Memory — One Call

```
memory_write(
  content="Full detail: mc alias pearldiver, path misc/static/com/pearldivergame/dev, run VITE_ENVIRONMENT=testnet npm run gen-translations after editing CSV files. Never edit local JSON files directly.",
  tags=["translations", "minio", "mc", "i18n"],
  summary="Translations workflow — mc alias pearldiver, run gen-translations after CSV edits"
)
```

This creates:
- **Deep entry** `abc123`: full content, searchable by tags
- **Lite pointer**: `[→ abc123] Translations workflow — mc alias pearldiver, run gen-translations after CSV edits [translations, minio, mc, i18n]`

Next session, Claude sees the pointer in context and calls `memory_get("abc123")` when needed.

## Reading Memory

| Situation | Tool |
|-----------|------|
| Session start, see `[→ id]` pointer and need full details | `memory_get(id)` |
| Don't have ID, need to find by topic | `memory_search("topic")` |
| User asks "show memory" / "what do you remember" | `memory_read_lite()` |
| Auditing or cleaning up entries | `memory_read_all()` — management only |

**Never call `memory_read_all` for a regular read request.** It dumps the entire database.

## Credentials and Tokens — Save Immediately

When the user provides any credential, save it **before using it**. The `.memory/` database is gitignored — safe to store credentials.

```
memory_write(
  content="GitHub PAT for knownout account: ghp_xxxx. Use when osxkeychain has wrong account cached.",
  tags=["github", "token", "credentials"],
  summary="GitHub PAT for knownout account (use when osxkeychain fails)"
)
```

## Standalone Lite Facts (no deep counterpart)

For very short always-needed facts that don't need a deep entry, pass `layer="lite"` explicitly:

```
memory_write(
  content="Active stack: Next.js frontend, FastAPI backend, PostgreSQL",
  tags=["stack"],
  layer="lite"
)
```

## What to Save

Only save things that would be **useful to Claude in a future session**:

| Operation | What to capture |
|-----------|-----------------|
| **Uploads** | Tool, alias/bucket/path, exact command pattern |
| **Deployments** | Full steps in order, branch names, tag format, CI tool |
| **Pipeline checks** | How to check status, success criteria |
| **Database ops** | Connection method, migration command, env |
| **External APIs** | Endpoint patterns, auth, rate limits |
| **Credentials** | Token values, where they apply |
| **Errors + fixes** | What broke, exact fix, root cause |

## What NOT to Save

Do NOT write any of these to memory:

- **Changelogs or update notes** — "bumped version to 1.8.3", "renamed light to lite". Git history already tracks this.
- **Session summaries** — "today we refactored the DB layer". This is noise, not reusable knowledge.
- **Task progress** — "step 3 is done". This is ephemeral, not persistent context.
- **Code you just wrote** — the code is already in the codebase. Don't duplicate it in memory.
- **Obvious facts** — "this project uses TypeScript". Claude can figure this out by reading the code.

**Rule of thumb:** if it won't help Claude complete a task in a *future* session, don't save it.

## Decision Flow

```
Session starts?
  → Read injected lite memory and topic index (already in context)
  → For relevant [→ id] pointers → memory_get(id)

User provides credential/token?
  → memory_write(...) IMMEDIATELY before using it

Completed external task?
  → memory_write(content=<full detail>, tags=[...], summary=<1 sentence>)
```

## Red Flags

- You call `memory_read_all` when the user just wants to see what's saved
- You write separate lite and deep entries manually instead of one `memory_write` call
- User provides a token and you use it without saving it first
- You search deep memory for something that's already in a lite pointer you can see
- You save changelogs, session summaries, version bumps, or task progress to memory
