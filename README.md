# Wiolett Industries — Agent Marketplace

Claude Code plugin marketplace for [Wiolett Industries](https://wiolett.net).

## Installation

Add this marketplace to Claude Code:

```
/plugin marketplace add wiolett-industries/agent-marketplace
```

## Plugins

### [project-memory](./packages/project-memory)

Persistent, searchable memory for Claude Code, scoped per project. Memories are stored as JSON files committed to git — enabling team sharing. Two-layer store: lite (always-loaded context) and deep (hybrid semantic+keyword search via OpenAI embeddings).

```
/plugin install project-memory@wiolett-industries
```

### [papers](./packages/papers)

Interact with [Papers](https://wiolett.net) documents directly from Claude Code. Create, edit, organize documents and manage shares via natural language.

```
/plugin install papers@wiolett-industries
```

## Repository Structure

```
packages/
  project-memory/   — project memory MCP plugin
  papers/           — Papers MCP plugin
```
