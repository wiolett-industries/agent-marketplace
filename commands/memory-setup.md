---
description: Set up the project-memory MCP server for the current project. Installs npm dependencies and registers the server in .mcp.json in the current working directory.
argument-hint: Optional OpenAI API key (sk-...)
---

# Project Memory Setup

You are setting up the `project-memory` MCP server for the **current project** (scoped to the current working directory).

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

### 4. Register MCP server in .mcp.json in the current project

Get the current working directory:
```bash
pwd
```

Read the existing `.mcp.json` in that directory (it may not exist yet). Merge in the project-memory server entry, then write it back.

The entry to add:
```json
{
  "project-memory": {
    "command": "<PLUGIN_PATH>/node_modules/.bin/tsx",
    "args": ["<PLUGIN_PATH>/src/index.ts"],
    "env": {
      "OPENAI_API_KEY": "<API_KEY>"
    }
  }
}
```

Replace `<PLUGIN_PATH>` with the actual plugin path and `<API_KEY>` with the key obtained in step 2.

The full `.mcp.json` must be valid JSON with this structure:
```json
{
  "mcpServers": {
    "project-memory": { ... }
  }
}
```

Write the file to `<CWD>/.mcp.json`.

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
- Plugin path found at `PLUGIN_PATH`
- MCP server registered in `.mcp.json` in the current project directory
- **Restart Claude Code** to activate the `project-memory` MCP tools
- Run `/memory-setup` again in any other project where you want memory enabled

---

## Troubleshooting

**npm install fails** — ensure Node.js 22.5+ is installed (`node --version`)

**OPENAI_API_KEY missing** — semantic search will fail; keyword-only fallback still works but results will be lower quality

**MCP server not appearing** — fully quit and relaunch Claude Code after editing `.mcp.json`
