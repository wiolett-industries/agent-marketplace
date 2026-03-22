import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { PapersClient } from "../client.js";

export const documentTools: Tool[] = [
  {
    name: "papers_list_documents",
    description: "List documents accessible to the authenticated user. Supports search and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search query to filter documents by title" },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page (default: 20, max: 100)" },
      },
    },
  },
  {
    name: "papers_get_document",
    description: "Get a document by ID, including its full content.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Document ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "papers_create_document",
    description: "Create a new document.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Document title" },
        content: { type: "string", description: "Document HTML content" },
        visibility: { type: "string", enum: ["private", "internal", "public"], description: "Visibility setting" },
        directoryId: { type: "string", description: "Directory ID to place the document in" },
      },
    },
  },
  {
    name: "papers_update_document",
    description: "Update an existing document's title, content, visibility, or directory.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Document ID" },
        title: { type: "string" },
        content: { type: "string", description: "Document HTML content" },
        visibility: { type: "string", enum: ["private", "internal", "public"] },
        directoryId: { type: "string", description: "Directory ID, or null to remove from directory" },
      },
      required: ["id"],
    },
  },
  {
    name: "papers_delete_document",
    description: "Delete a document permanently.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Document ID" },
      },
      required: ["id"],
    },
  },
];

export async function handleDocumentTool(
  name: string,
  args: Record<string, unknown>,
  client: PapersClient
): Promise<unknown> {
  switch (name) {
    case "papers_list_documents":
      return client.get("/documents", {
        search: args.search as string | undefined,
        page: args.page as number | undefined,
        limit: args.limit as number | undefined,
      });

    case "papers_get_document":
      return client.get(`/documents/${args.id}`);

    case "papers_create_document":
      return client.post("/documents", {
        title: args.title,
        content: args.content ?? "",
        visibility: args.visibility ?? "private",
        directoryId: args.directoryId,
      });

    case "papers_update_document": {
      const { id, ...rest } = args;
      return client.patch(`/documents/${id}`, rest);
    }

    case "papers_delete_document":
      return client.delete(`/documents/${args.id}`);

    default:
      throw new Error(`Unknown document tool: ${name}`);
  }
}
