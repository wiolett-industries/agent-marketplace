---
name: using-papers
description: Use when working with Papers documents — creating, editing, organizing, or sharing documents via the papers MCP tools.
---

# Using Papers

Papers MCP gives you 17 tools to interact with the Papers document platform on behalf of the user.

## Available Tools

### Documents
| Tool | When to use |
|------|-------------|
| `papers_list_documents` | Browse or search the user's documents |
| `papers_get_document` | Read a specific document's full content |
| `papers_create_document` | Create a new document |
| `papers_update_document` | Edit title, content, visibility, or move to directory |
| `papers_delete_document` | Delete a document |

### Directories
| Tool | When to use |
|------|-------------|
| `papers_list_directories` | See the folder structure |
| `papers_create_directory` | Create a new folder |
| `papers_update_directory` | Rename or move a folder |
| `papers_delete_directory` | Delete a folder |

### Shares
| Tool | When to use |
|------|-------------|
| `papers_list_shares` | See who has access to a document |
| `papers_create_share` | Share a document with a user |
| `papers_update_share` | Change a user's permission level |
| `papers_delete_share` | Remove access for a user |

### Attachments
| Tool | When to use |
|------|-------------|
| `papers_list_attachments` | List files attached to a document |
| `papers_get_attachment_url` | Get a download URL for a file |
| `papers_upload_attachment` | Upload a file (base64-encoded) |
| `papers_delete_attachment` | Remove an attachment |

## Visibility levels

- `private` — only the owner can see it
- `internal` — all authenticated users on the instance
- `public` — anyone with the link

## Permission levels

- `view` — read only
- `edit` — can edit content
- `manage` — can manage shares
- `admin` — full control

## Tips

- When creating or updating document content, use HTML.
- `papers_list_documents` supports `search`, `page`, and `limit`.
- Always `papers_get_document` before `papers_update_document` when you need to preserve existing content.
