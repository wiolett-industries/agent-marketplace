---
description: Set up the papers MCP server manually. Install npm dependencies and register the server in whatever user-level MCP config your host uses.
argument-hint: "[PAPERS_HOST] [PAPERS_TOKEN]  (e.g. https://papers.wiolett.net tok_...)"
---

# Papers Setup

You are setting up the `papers` MCP server for the current user. This only needs to be done once per machine or profile.

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

### 2. Register the MCP server

Add this entry to the user-level MCP config used by the current host:

```json
{
  "mcpServers": {
    "papers": {
      "command": "/path/to/agent-marketplace/packages/papers/node_modules/.bin/tsx",
      "args": ["/path/to/agent-marketplace/packages/papers/src/index.ts"],
      "env": {
        "PAPERS_HOST": "<PAPERS_HOST>",
        "PAPERS_TOKEN": "<PAPERS_TOKEN>"
      }
    }
  }
}
```

### 5. Report result

Tell the user:
- MCP server registered in the host's user-level MCP config
- Restart the host if the `papers` tools do not appear immediately

---

## Troubleshooting

**npm install fails** — ensure Node.js 18+ is installed (`node --version`)

**Token rejected** — generate a new token in Papers: profile dropdown → Settings → API Tokens

**MCP server not appearing** — fully quit and relaunch the host after setup
