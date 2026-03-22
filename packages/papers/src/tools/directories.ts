import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { PapersClient } from "../client.js";

export const directoryTools: Tool[] = [
  {
    name: "papers_list_directories",
    description: "List all directories the user has access to.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "papers_create_directory",
    description: "Create a new directory for organizing documents.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Directory name" },
        color: { type: "string", description: "Color hex code (e.g. #ff5500)" },
        icon: { type: "string", description: "Icon identifier" },
        parentId: { type: "string", description: "Parent directory ID for nesting" },
      },
      required: ["name"],
    },
  },
  {
    name: "papers_update_directory",
    description: "Update a directory's name, color, icon, or parent.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Directory ID" },
        name: { type: "string" },
        color: { type: "string" },
        icon: { type: "string" },
        parentId: { type: "string", description: "Parent directory ID, or null to move to root" },
      },
      required: ["id"],
    },
  },
  {
    name: "papers_delete_directory",
    description: "Delete a directory. Documents inside will be moved to the root.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Directory ID" },
      },
      required: ["id"],
    },
  },
];

export async function handleDirectoryTool(
  name: string,
  args: Record<string, unknown>,
  client: PapersClient
): Promise<unknown> {
  switch (name) {
    case "papers_list_directories":
      return client.get("/directories");

    case "papers_create_directory":
      return client.post("/directories", args);

    case "papers_update_directory": {
      const { id, ...rest } = args;
      return client.patch(`/directories/${id}`, rest);
    }

    case "papers_delete_directory":
      return client.delete(`/directories/${args.id}`);

    default:
      throw new Error(`Unknown directory tool: ${name}`);
  }
}
