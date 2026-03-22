---
description: Set up the claude-papers MCP server globally. Installs npm dependencies and registers the server in ~/.claude.json so Papers tools are available in every project.
argument-hint: "[PAPERS_HOST] [PAPERS_TOKEN]  (e.g. https://papers.wiolett.net tok_...)"
---

# Papers Setup

You are setting up the `claude-papers` MCP server **globally** for the current user. This only needs to be done once — the Papers tools will be available in every Claude Code session.

## Steps

### 1. Get PAPERS_HOST and PAPERS_TOKEN

Parse `$ARGUMENTS` — it may contain one or both values in the form `https://... tok_...`.

- If `$ARGUMENTS` contains a URL (starts with `http`), use it as `PAPERS_HOST`.
- If `$ARGUMENTS` contains a token (starts with `tok_`), use it as `PAPERS_TOKEN`.

For any missing values, check the environment:
```bash
echo "${PAPERS_HOST:-NOT_SET}"
echo "${PAPERS_TOKEN:-NOT_SET}"
```

If still missing, ask the user:
> Please provide your Papers instance URL (e.g. https://papers.wiolett.net):
> Please provide your Papers API token (tok_...):

### 2. Register MCP server globally

```bash
claude mcp add papers -s user \
  -e PAPERS_HOST="<PAPERS_HOST>" \
  -e PAPERS_TOKEN="<PAPERS_TOKEN>" \
  -- /path/to/agent-marketplace/packages/papers/node_modules/.bin/tsx \
     /path/to/agent-marketplace/packages/papers/src/index.ts
```

Replace `<PAPERS_HOST>` and `<PAPERS_TOKEN>` with the actual values.

### 5. Report result

Tell the user:
- MCP server registered globally in `~/.claude.json`
- **Restart Claude Code** to activate the `papers` MCP tools in all projects

---

## Troubleshooting

**npm install fails** — ensure Node.js 18+ is installed (`node --version`)

**Token rejected** — generate a new token in Papers: profile dropdown → Settings → API Tokens

**MCP server not appearing** — fully quit and relaunch Claude Code after setup
