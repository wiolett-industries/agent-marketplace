import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { PapersClient } from "../client.js";

export const attachmentTools: Tool[] = [
  {
    name: "papers_list_attachments",
    description: "List file attachments for a document.",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string", description: "Document ID" },
      },
      required: ["documentId"],
    },
  },
  {
    name: "papers_get_attachment_url",
    description: "Get a download URL for an attachment.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Attachment ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "papers_upload_attachment",
    description: "Upload a file attachment to a document (provide file data as base64).",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string" },
        filename: { type: "string" },
        mimeType: { type: "string" },
        base64Data: { type: "string", description: "Base64-encoded file contents" },
      },
      required: ["documentId", "filename", "mimeType", "base64Data"],
    },
  },
  {
    name: "papers_delete_attachment",
    description: "Delete a file attachment.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Attachment ID" },
      },
      required: ["id"],
    },
  },
];

export async function handleAttachmentTool(
  name: string,
  args: Record<string, unknown>,
  client: PapersClient
): Promise<unknown> {
  switch (name) {
    case "papers_list_attachments":
      return client.get(`/attachments`, { documentId: args.documentId as string });

    case "papers_get_attachment_url":
      return client.get(`/attachments/${args.id}/url`);

    case "papers_upload_attachment":
      return client.post(`/attachments`, {
        documentId: args.documentId,
        filename: args.filename,
        mimeType: args.mimeType,
        base64Data: args.base64Data,
      });

    case "papers_delete_attachment":
      return client.delete(`/attachments/${args.id}`);

    default:
      throw new Error(`Unknown attachment tool: ${name}`);
  }
}
