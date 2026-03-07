---
name: using-project-memory
description: Use when the project-memory MCP server is available - at every conversation start and after completing any task involving external tools, deployments, uploads, pipelines, credentials, or project-specific workflows
---

# Using Project Memory

## Overview

The `project-memory` MCP gives Claude persistent memory scoped to the current project. Two layers: **light** (always-loaded context) and **deep** (searchable on demand).

**Core principle:** Read at start. Save after any non-trivial external operation. Future Claude will thank you.

## Mandatory Start-of-Session Ritual

At the **very beginning** of every conversation, BEFORE doing anything else:

1. Call `memory_read_light()` — get immediate project context
2. If the task involves an area you worked on before, call `memory_search(query)` to pull relevant deep memories

Never skip this. Zero-context responses waste the user's time.

## What to Save

### Always save to **light** layer
- Critical project conventions (naming, branch strategy, env structure)
- Key decisions that affect all future work ("we use mc minio client, not AWS CLI")
- Active credentials or config locations ("MINIO_ALIAS=prod, bucket=project-uploads")
- Infrastructure topology ("staging: k8s on gitlab runner, prod: manual tag deploy")

### Always save to **deep** layer (save immediately after completing)

| Operation type | What to capture |
|---------------|-----------------|
| **File/object uploads** | Tool used (mc, aws, gsutil), alias/bucket/path, auth method, exact command pattern |
| **Deployments** | Steps in order (push → tag → pipeline watch), branch names, tag format, CI tool |
| **Pipeline/CI checks** | How to check status (gitlab MCP, gh CLI, etc.), what success looks like |
| **Database ops** | Connection method, migration command, which env |
| **External API calls** | Endpoint patterns, auth mechanism, rate limits discovered |
| **Manual infra steps** | Anything done outside normal code flow |
| **Errors + fixes** | What broke, exact fix applied, root cause |

## Concrete Examples

**S3/MinIO upload via mc client:**
```
content: "File uploads use mc minio client. Alias: myminio. Command: mc cp <file> myminio/bucket-name/path/. Credentials in .env as MINIO_ENDPOINT/ACCESS_KEY/SECRET_KEY."
tags: ["uploads", "minio", "s3"]
layer: "deep"
```

**GitLab deploy workflow:**
```
content: "Deploy: 1) git push origin main 2) git tag v1.x.x && git push origin v1.x.x 3) Check pipeline via GitLab MCP: list_pipelines(project_id=42) and watch for 'success' status on tag pipeline."
tags: ["deploy", "gitlab", "pipeline", "release"]
layer: "deep"
```

**Light layer — key convention:**
```
content: "Project uses GitLab CI. Tag format: v{major}.{minor}.{patch}. Only tags trigger production deploy. Staging deploys on every push to main."
tags: ["deploy", "conventions"]
layer: "light"
```

## When to Search vs When to Read Light

```
Starting conversation? → memory_read_light() always
About to do external operation? → memory_search("uploads") / memory_search("deploy")
User mentions unfamiliar tool/service? → memory_search(tool name)
Just completed any external task? → memory_write(...) immediately
```

## What NOT to Save

- Temporary debug output or one-off test results
- Information already in the repo (README, Makefile)
- Standard library usage with no project-specific twist
- Anything the user can trivially re-explain in one sentence

## After Every External Tool Operation

Before closing out a task, ask yourself: "Would future Claude need to Google this, or ask the user again?"

If yes → `memory_write()` it now.

**Red flags you forgot to save:**
- User says "like we did last time" and you have no idea what they mean
- User has to re-explain the same deploy process twice
- You ask for credentials/endpoints the user already gave before
