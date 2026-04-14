#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PapersClient } from "./client.js";
import { documentTools, handleDocumentTool } from "./tools/documents.js";
import { directoryTools, handleDirectoryTool } from "./tools/directories.js";
import { shareTools, handleShareTool } from "./tools/shares.js";
import { attachmentTools, handleAttachmentTool } from "./tools/attachments.js";

const allTools = [...documentTools, ...directoryTools, ...shareTools, ...attachmentTools];

const client = new PapersClient();

const server = new Server(
  { name: "papers", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const typedArgs = args as Record<string, unknown>;

  try {
    let result: unknown;

    if (documentTools.some((t) => t.name === name)) {
      result = await handleDocumentTool(name, typedArgs, client);
    } else if (directoryTools.some((t) => t.name === name)) {
      result = await handleDirectoryTool(name, typedArgs, client);
    } else if (shareTools.some((t) => t.name === name)) {
      result = await handleShareTool(name, typedArgs, client);
    } else if (attachmentTools.some((t) => t.name === name)) {
      result = await handleAttachmentTool(name, typedArgs, client);
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
