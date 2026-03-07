---
name: using-project-memory
description: Use when the project-memory MCP server is available - at every conversation start and after completing any task involving external tools, deployments, uploads, pipelines, credentials, tokens, or project-specific workflows
---

# Using Project Memory

## Overview

The `project-memory` MCP gives Claude persistent memory scoped to the current project.

**Two layers with distinct roles:**

| Layer | Role | Size |
|-------|------|------|
| `light` | Short pointers to deep memories + critical always-needed facts | 1 sentence max per entry |
| `deep` | All actual content — detailed, fully searchable | No limit |

**Core principle:** Store everything in `deep`. Use `light` only as a lean index so Claude knows what exists.

## Session Start — What You Already Have

At session start the hook has already injected:
1. **Light layer** — your pointers and critical facts
2. **Deep memory topic index** — all tags from deep entries, showing what's searchable

Read these before responding. If a topic in the index is relevant to the task, call `memory_search(topic)` to load it.

## The Pointer Pattern — How to Use Light Correctly

**Wrong:** Saving full content to light (bloats context, defeats the purpose)
```
# BAD - don't do this
memory_write("Deploy: git push origin main, then git tag v1.x.x, push tag, check GitLab pipeline...", layer="light")
```

**Right:** Save detail to deep, save a 1-sentence pointer to light
```
# Step 1: save detail to deep
memory_write(
  content="Deploy workflow: 1) git push origin main 2) git tag v1.x.x && git push origin v1.x.x 3) Check pipeline via GitLab MCP list_pipelines(project_id=42), wait for 'success' on tag pipeline.",
  tags=["deploy", "gitlab", "pipeline", "release"],
  layer="deep"
)

# Step 2: save pointer to light
memory_write(
  content="Deep memory: full deployment workflow available (search: deploy, gitlab)",
  tags=["deploy"],
  layer="light"
)
```

Now at session start Claude sees `"Deep memory: full deployment workflow available"` without loading the full text. When a deploy task comes up, Claude calls `memory_search("deploy")` to get the details.

## What Goes in Light (Pointers + Critical Facts)

**Pointers** — 1 sentence referencing what's in deep:
- `"Deep memory: S3/MinIO upload workflow via mc client (search: minio, uploads)"`
- `"Deep memory: GitLab deploy process with tag-based pipeline (search: deploy)"`
- `"Deep memory: GitHub PAT stored for knownout account (search: github, credentials)"`

**Critical always-needed facts** — things Claude needs without searching, kept very short:
- `"Active stack: Next.js frontend, FastAPI backend, PostgreSQL"`
- `"Monorepo: apps/web, apps/api, packages/shared"`
- `"Main branch deploys to staging; tags deploy to prod"`

**NOT for light:**
- Full command sequences
- Long explanations
- Anything over 1 sentence

## Credentials and Tokens — Save Immediately

**When the user provides any credential — save it to deep before using it.**

The `.memory/` database is gitignored and local-only. Safe to store credentials.

```
# Save to deep with credential content
memory_write(
  content="GitHub PAT for knownout: ghp_xxxx. Use when osxkeychain has wrong account.",
  tags=["github", "token", "credentials"],
  layer="deep"
)
# Save pointer to light
memory_write(
  content="Deep memory: GitHub PAT for knownout stored (search: github, credentials)",
  tags=["credentials"],
  layer="light"
)
```

**Do not wait.** Save credential as the very next action after receiving it.

## Decision Flow

```
Session starts?
  → Read injected light layer + topic index (already in context)
  → For each relevant topic in index → memory_search(topic)

User asks about something?
  → Check topic index — does a relevant tag exist?
  → If yes → memory_search(tag) before responding

User provides a credential/token?
  → memory_write to deep IMMEDIATELY
  → memory_write pointer to light

Completed an external task (upload, deploy, API call, fix)?
  → memory_write detail to deep with good tags
  → memory_write 1-sentence pointer to light
```

## What to Save to Deep

| Operation | What to capture |
|-----------|-----------------|
| **Uploads** | Tool (mc, aws, gsutil), alias/bucket/path, exact command |
| **Deployments** | Full steps in order, branch names, tag format, CI tool |
| **Pipeline checks** | How to check status, what success looks like |
| **Database ops** | Connection method, migration command, env |
| **External APIs** | Endpoint patterns, auth, rate limits |
| **Credentials** | Token values, where they apply |
| **Errors + fixes** | What broke, exact fix, root cause |

## What NOT to Save

- Temporary debug output or one-off results
- Information already in the repo (README, Makefile, .env.example)
- Standard library usage with no project-specific twist

## Red Flags

- Light layer has entries longer than 1–2 sentences → move content to deep, replace with pointer
- You answer a question about the project without checking the topic index first
- User says "like we discussed before" and you have no context → you missed a `memory_search`
- User provides a token and you use it without saving it first
