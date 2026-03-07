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

### 5. Initialize the database

Create `.memory/` and initialize the SQLite schema so the hook can find the database immediately (before the MCP server is ever started).

Replace `<CWD>` with the actual working directory from step 4:

```bash
mkdir -p <CWD>/.memory
DB_INIT_PATH="<CWD>/.memory/memory.db" node --input-type=module --no-warnings << 'NODEOF'
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync(process.env.DB_INIT_PATH);
db.prepare("CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, content TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', layer TEXT NOT NULL DEFAULT 'deep', ref TEXT DEFAULT NULL, embedding TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)").run();
db.prepare("CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(content, tags, content='entries', content_rowid='rowid')").run();
console.log('Database initialized');
NODEOF
```

Also add `.memory/` to `.gitignore` if not already present:

```bash
grep -qxF '.memory/' <CWD>/.gitignore 2>/dev/null || echo '.memory/' >> <CWD>/.gitignore
```

### 6. Verify

```bash
ls -lh <CWD>/.memory/memory.db
```

### 7. Report result

Tell the user:
- Plugin path found at `PLUGIN_PATH`
- MCP server registered in `.mcp.json` in the current project directory
- Database initialized at `.memory/memory.db` (gitignored)
- **Restart Claude Code** to activate the `project-memory` MCP tools
- Run `/project-memory:memory-setup` again in any other project where you want memory enabled

---

## Troubleshooting

**npm install fails** — ensure Node.js 22.5+ is installed (`node --version`)

**OPENAI_API_KEY missing** — semantic search will fail; keyword-only fallback still works but results will be lower quality

**MCP server not appearing** — fully quit and relaunch Claude Code after editing `.mcp.json`
