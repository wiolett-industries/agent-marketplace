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

## When to Save — Proactive Triggers

Save memory proactively whenever any of the following happens during a session. Do not wait for the user to ask — if the trigger applies, save immediately.

### Always save immediately:
- **User provides a credential, token, API key, or secret** — save BEFORE using it
- **User tells you a project convention** — naming, folder structure, branching strategy, coding style, preferred tools
- **User corrects your mistake** — save the correct approach so the same mistake is never repeated
- **User explains a non-obvious workflow** — anything that isn't self-evident from the code alone

### Save after completing:
- **Deployment or release steps** — full sequence, commands, environment, branch names
- **File uploads or asset management** — tool, alias, bucket, path, exact command
- **Pipeline or CI/CD operations** — how to trigger, monitor, check status
- **Database operations** — connection method, migration commands, seed data steps
- **External API interactions** — endpoint patterns, auth method, rate limits, quirks
- **Infrastructure setup** — server config, DNS, SSL, container orchestration
- **Build or dev environment setup** — required env vars, tool versions, config files
- **Debugging a tricky issue** — root cause, the fix, and why it works (so future sessions skip the investigation)
- **Integration with third-party services** — Slack, GitHub, S3, Sentry, etc. — account details, webhook URLs, config

### Save when you discover:
- **Project-specific gotchas** — things that break if done the "obvious" way
- **Undocumented dependencies** — services, tools, or config the project relies on but doesn't document
- **Team preferences** — "always use bun, not npm", "never force push to main", "use conventional commits"

## Credentials and Tokens — Save Immediately

When the user provides any credential, save it **before using it**. Entry files are committed to git — only store credentials if the repo is private or the team is trusted.

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

## What NOT to Save

Do NOT write any of these to memory:

- **Changelogs or update notes** — "bumped version to 1.8.3", "renamed light to lite". Git history already tracks this.
- **Session summaries** — "today we refactored the DB layer". This is noise, not reusable knowledge.
- **Task progress** — "step 3 is done". This is ephemeral, not persistent context.
- **Code you just wrote** — the code is already in the codebase. Don't duplicate it in memory.
- **Obvious facts** — "this project uses TypeScript". Claude can figure this out by reading the code.
- **Speculative plans** — "we might add feature X later". Save only what IS, not what might be.

**Rule of thumb:** if it won't help Claude complete a task in a *future* session, don't save it.

## Decision Flow

```
Session starts?
  → Read injected lite memory and topic index (already in context)
  → For relevant [→ id] pointers → memory_get(id)

User provides credential/token/secret?
  → memory_write(...) IMMEDIATELY before using it

User explains a convention, preference, or workflow?
  → memory_write(...) right away

Completed external task (deploy, upload, pipeline, DB op, API call)?
  → memory_write(content=<full detail>, tags=[...], summary=<1 sentence>)

Discovered a gotcha, undocumented dependency, or non-obvious fix?
  → memory_write(...) before moving on

User corrected you on something?
  → memory_write the correct approach
```

## Red Flags

- You call `memory_read_all` when the user just wants to see what's saved
- You write separate lite and deep entries manually instead of one `memory_write` call
- User provides a token and you use it without saving it first
- You search deep memory for something that's already in a lite pointer you can see
- You save changelogs, session summaries, version bumps, or task progress to memory
- User explains a workflow and you don't save it
- You complete an external operation and don't save the steps
