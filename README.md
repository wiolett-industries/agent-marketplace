# Wiolett Industries Codex Marketplace

Codex-first plugin marketplace for [Wiolett Industries](https://wiolett.net). This repo now exposes a Codex marketplace manifest under `.agents/plugins/` and plugin roots under `plugins/`, while the MCP server implementations continue to live under `packages/`.

## Codex Layout

- Marketplace manifest: [`.agents/plugins/marketplace.json`](./.agents/plugins/marketplace.json)
- Plugin roots:
  - [`plugins/project-memory`](./plugins/project-memory)
  - [`plugins/papers`](./plugins/papers)
- MCP package source:
  - [`packages/project-memory`](./packages/project-memory)
  - [`packages/papers`](./packages/papers)

Point Codex at this repo's local marketplace manifest to install the plugins.

## Plugins

### [project-memory](./plugins/project-memory)

Persistent, searchable project memory for Codex and other MCP-capable agents. Memory is stored as JSON files committed to the project repo, with a lite/deep split to keep default context lean.

See [packages/project-memory/README.md](./packages/project-memory/README.md) for setup and manual MCP configuration details.

### [papers](./plugins/papers)

Interact with [Papers](https://wiolett.net) documents directly from Codex or any MCP-capable client. Create, edit, organize documents, shares, and attachments through the bundled Papers MCP server.

See [packages/papers/README.md](./packages/papers/README.md) for setup and manual MCP configuration details.
