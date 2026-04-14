---
description: Set up the project-memory MCP server for the current project. Installs npm dependencies, initializes .memory, and registers the server in .codex/config.toml in the current working directory.
argument-hint: Optional OpenAI API key (sk-...)
---

# Project Memory Setup

You are setting up the `project-memory` MCP server for the current project.

From the plugin root, run the bundled setup script while your shell is in the project you want to enable. Pass `$ARGUMENTS` through as the optional OpenAI API key:

```bash
bash ./scripts/setup-current-project.sh "$ARGUMENTS"
```

Then report:
- Database initialized in `PWD/.memory/`
- MCP server registered in `PWD/.codex/config.toml`
- `.codex/config.toml` added to `.gitignore` if needed
- Re-run the same command in any other project where memory should be enabled

---

## Troubleshooting

**npm install fails** — ensure Node.js 22.5+ is installed (`node --version`)

**OPENAI_API_KEY missing** — semantic search will degrade to keyword-only; still functional

**MCP server not appearing** — restart Codex after editing `.codex/config.toml`
