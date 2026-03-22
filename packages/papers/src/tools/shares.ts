import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { PapersClient } from "../client.js";

export const shareTools: Tool[] = [
  {
    name: "papers_list_shares",
    description: "List shares for a document.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string", description: "Document ID" },
      },
      required: ["documentId"],
    },
  },
  {
    name: "papers_create_share",
    description: "Share a document with a user.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string" },
        userId: { type: "string", description: "User ID to share with" },
        permission: { type: "string", enum: ["view", "edit", "manage", "admin"] },
      },
      required: ["documentId", "permission"],
    },
  },
  {
    name: "papers_update_share",
    description: "Update a share's permission level.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string" },
        shareId: { type: "string" },
        permission: { type: "string", enum: ["view", "edit", "manage", "admin"] },
      },
      required: ["documentId", "shareId", "permission"],
    },
  },
  {
    name: "papers_delete_share",
    description: "Remove a share from a document.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string" },
        shareId: { type: "string" },
      },
      required: ["documentId", "shareId"],
    },
  },
];

export async function handleShareTool(
  name: string,
  args: Record<string, unknown>,
  client: PapersClient
): Promise<unknown> {
  switch (name) {
    case "papers_list_shares":
      return client.get(`/documents/${args.documentId}/shares`);

    case "papers_create_share":
      return client.post(`/documents/${args.documentId}/shares`, {
        userId: args.userId,
        permission: args.permission,
      });

    case "papers_update_share":
      return client.patch(`/documents/${args.documentId}/shares/${args.shareId}`, {
        permission: args.permission,
      });

    case "papers_delete_share":
      return client.delete(`/documents/${args.documentId}/shares/${args.shareId}`);

    default:
      throw new Error(`Unknown share tool: ${name}`);
  }
}
