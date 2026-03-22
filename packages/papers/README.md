# papers — Claude Code MCP Plugin

Interact with [Papers](https://wiolett.net) documents directly from Claude Code. Create, edit, organize documents and manage shares — all via natural language.

## Installation

### Plugin (recommended)

```
/plugin marketplace add wiolett-industries/agent-marketplace
/plugin install papers@wiolett-industries
```

### Manual

1. Clone and install:
   ```bash
   git clone https://github.com/wiolett-industries/agent-marketplace.git
   cd agent-marketplace/packages/papers && npm install
   ```

2. Register the MCP server:
   ```bash
   claude mcp add papers -s user \
     -e PAPERS_HOST=https://papers.wiolett.net \
     -e PAPERS_TOKEN=tok_... \
     -- /path/to/agent-marketplace/packages/papers/node_modules/.bin/tsx \
        /path/to/agent-marketplace/packages/papers/src/index.ts
   ```

Restart Claude Code. The `papers` MCP tools will be available in every project.

Generate your API token in Papers: **profile dropdown → Settings → API Tokens**.

## Tools

### Documents
| Tool | Description |
|------|-------------|
| `papers_list_documents` | List documents with optional search and pagination |
| `papers_get_document` | Get a document by ID including full content |
| `papers_create_document` | Create a new document |
| `papers_update_document` | Update title, content, visibility, or directory |
| `papers_delete_document` | Delete a document permanently |

### Directories
| Tool | Description |
|------|-------------|
| `papers_list_directories` | List all directories |
| `papers_create_directory` | Create a directory |
| `papers_update_directory` | Rename or move a directory |
| `papers_delete_directory` | Delete a directory |

### Shares
| Tool | Description |
|------|-------------|
| `papers_list_shares` | List shares for a document |
| `papers_create_share` | Share a document with a user |
| `papers_update_share` | Change a share's permission level |
| `papers_delete_share` | Remove a share |

### Attachments
| Tool | Description |
|------|-------------|
| `papers_list_attachments` | List attachments for a document |
| `papers_get_attachment_url` | Get a download URL for an attachment |
| `papers_upload_attachment` | Upload a file (base64-encoded) |
| `papers_delete_attachment` | Delete an attachment |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `PAPERS_HOST` | Yes | Your Papers instance URL (e.g. `https://papers.wiolett.net`) |
| `PAPERS_TOKEN` | Yes | API token starting with `tok_` |

## Requirements

- Node.js 18+
- A Papers account with API token access
