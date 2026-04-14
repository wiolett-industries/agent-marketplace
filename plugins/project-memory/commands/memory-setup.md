---
description: Set up project-memory for the current repo. Installs package dependencies, initializes .memory, and writes a project-local .codex/config.toml.
argument-hint: Optional OpenAI API key (sk-...)
---

# Project Memory Setup

From the plugin root, run the bundled setup script while your shell is in the project you want to enable:

```bash
bash ./scripts/setup-current-project.sh "$ARGUMENTS"
```

After it completes, report:
- `.memory/entries/` and `.memory/memory.db` were initialized for the current repo
- `.codex/config.toml` now contains the `project-memory` MCP server entry
- `.codex/config.toml` was added to `.gitignore` if needed
- Re-run the same command in any other project where memory should be enabled
