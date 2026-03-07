---
description: Set up the project-memory MCP server for the current project. Installs npm dependencies and registers the server in .mcp.json in the current working directory.
argument-hint: Optional OpenAI API key (sk-...)
---

# Project Memory Setup

You are setting up the `project-memory` MCP server for the **current project** (scoped to the current working directory).

## Steps

### 1. Find plugin install path

```bash
echo "$CLAUDE_PLUGIN_ROOT"
```

If empty, find it:

```bash
find ~/.claude/plugins/cache -name "plugin.json" -path "*/project-memory*" 2>/dev/null | head -1 | xargs dirname | xargs dirname
```

Store this as `PLUGIN_PATH`.

### 2. Get OpenAI API key

If `$ARGUMENTS` starts with `sk-`, use it as the API key.

Otherwise check the environment:
```bash
echo "${OPENAI_API_KEY:-NOT_SET}"
```

If not set and not provided, ask the user:
> Please provide your OpenAI API key (needed for semantic search embeddings):

### 3. Install npm dependencies

```bash
cd "$PLUGIN_PATH" && npm install --prefer-offline 2>&1 | tail -5
```

### 4. Get current working directory

```bash
pwd
```

Store this as `CWD`.

### 5. Initialize the database

Run the bundled init script — it creates `.memory/memory.db` and adds `.memory/` to `.gitignore`:

```bash
node --no-warnings "$PLUGIN_PATH/scripts/init-db.js" "$CWD"
```

### 6. Register MCP server in .mcp.json

Read the existing `$CWD/.mcp.json` (may not exist). Merge in the project-memory entry and write it back:

```json
{
  "mcpServers": {
    "project-memory": {
      "command": "<PLUGIN_PATH>/node_modules/.bin/tsx",
      "args": ["<PLUGIN_PATH>/src/index.ts"],
      "env": {
        "OPENAI_API_KEY": "<API_KEY>"
      }
    }
  }
}
```

Replace `<PLUGIN_PATH>` and `<API_KEY>` with the actual values.

### 7. Report result

Tell the user:
- Plugin path: `PLUGIN_PATH`
- Database initialized at `CWD/.memory/memory.db` (gitignored)
- MCP server registered in `CWD/.mcp.json`
- **Restart Claude Code** to activate the `project-memory` MCP tools
- Run `/project-memory:memory-setup` again in any other project where you want memory enabled

---

## Troubleshooting

**npm install fails** — ensure Node.js 22.5+ is installed (`node --version`)

**OPENAI_API_KEY missing** — semantic search will degrade to keyword-only; still functional

**MCP server not appearing** — fully quit and relaunch Claude Code after editing `.mcp.json`
