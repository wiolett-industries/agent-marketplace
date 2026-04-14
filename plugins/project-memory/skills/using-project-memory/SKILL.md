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

Next session, the agent sees the pointer in context and calls `memory_get("abc123")` when needed.

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
- **Debugging a tricky issue** — root cause, the fix, and why it works
- **Integration with third-party services** — Slack, GitHub, S3, Sentry, etc. — account details, webhook URLs, config

### Save when you discover:
- **Project-specific gotchas** — things that break if done the obvious way
- **Undocumented dependencies** — services, tools, or config the project relies on but doesn't document
- **Team preferences** — "always use bun, not npm", "never force push to main", "use conventional commits"

## Credentials and Tokens — Save Immediately

When the user provides any credential, save it before using it. Entry files are committed to git — only store credentials if the repo is private or the team is trusted.

```
memory_write(
  content="GitHub PAT for knownout account: ghp_xxxx. Use when osxkeychain has wrong account cached.",
  tags=["github", "token", "credentials"],
  summary="GitHub PAT for knownout account (use when osxkeychain fails)"
)
```

## Standalone Lite Facts

For very short always-needed facts that do not need a deep entry, pass `layer="lite"` explicitly:

```
memory_write(
  content="Active stack: Next.js frontend, FastAPI backend, PostgreSQL",
  tags=["stack"],
  layer="lite"
)
```

## What NOT to Save

Do NOT write any of these to memory:

- **Changelogs or update notes** — git history already tracks these
- **Session summaries** — noise, not reusable knowledge
- **Task progress** — ephemeral, not persistent context
- **Code you just wrote** — already in the codebase
- **Obvious facts** — the agent can figure them out by reading the code
- **Speculative plans** — save what is true now, not what might happen later

**Rule of thumb:** if it won't help the agent complete a task in a future session, don't save it.
