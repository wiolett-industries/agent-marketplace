---
description: Set up the project-memory MCP server globally. Installs npm dependencies and registers the server in ~/.claude/mcp.json.
argument-hint: Optional OpenAI API key (sk-...)
---

# Project Memory Setup

You are setting up the `project-memory` MCP server so it is available in all Claude Code sessions.

## Steps

### 1. Find plugin install path

Run this to get the plugin root:

```bash
echo "$CLAUDE_PLUGIN_ROOT"
```

If empty, find it by locating the plugin's characteristic file:

```bash
find ~/.claude/plugins/cache -name "plugin.json" -path "*/project-memory*" 2>/dev/null | head -1 | xargs dirname | xargs dirname
```

Store this path as `PLUGIN_PATH`.

### 2. Get OpenAI API key

If `$ARGUMENTS` starts with `sk-`, use it as the API key.

Otherwise, check if `OPENAI_API_KEY` is already set in the environment:
```bash
echo "${OPENAI_API_KEY:-NOT_SET}"
```

If not set and not provided as argument, ask the user:
> Please provide your OpenAI API key (needed for semantic search embeddings):

### 3. Install npm dependencies

```bash
cd "$PLUGIN_PATH" && npm install --prefer-offline 2>&1 | tail -5
```

### 4. Register MCP server in ~/.claude/mcp.json

Read the current `~/.claude/mcp.json` (it may not exist yet). Merge in the project-memory server entry, then write it back.

The entry to add:
```json
{
  "project-memory": {
    "command": "node",
    "args": ["--import", "tsx/esm", "--no-warnings", "<PLUGIN_PATH>/src/index.ts"],
    "env": {
      "OPENAI_API_KEY": "<API_KEY>"
    }
  }
}
```

Replace `<PLUGIN_PATH>` with the actual plugin path and `<API_KEY>` with the key obtained in step 2.

The full `~/.claude/mcp.json` must be valid JSON with this structure:
```json
{
  "mcpServers": {
    ... existing servers ...,
    "project-memory": { ... }
  }
}
```

### 5. Verify

```bash
node --input-type=module --no-warnings << 'EOF'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
console.log('node:sqlite OK');
EOF
```

### 6. Report result

Tell the user:
- Plugin path found
- MCP server registered at `~/.claude/mcp.json`
- **Restart Claude Code** to activate the `project-memory` MCP tools
- On first use in a new project, run `/memory-setup` again from that project directory if you want a project-scoped `.mcp.json` instead of the global one

---

## Troubleshooting

**npm install fails** — ensure Node.js 22.5+ is installed (`node --version`)

**OPENAI_API_KEY missing** — semantic search will fail; keyword-only fallback still works but results will be lower quality

**MCP server not appearing** — fully quit and relaunch Claude Code after editing `mcp.json`
