import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { handleWrite } from './tools/write.js';
import { handleReadLight } from './tools/read-light.js';
import { handleSearch } from './tools/search.js';
import { handleDelete } from './tools/delete.js';
import { handleReadAll } from './tools/read-all.js';

const server = new McpServer({
  name: 'project-memory',
  version: '1.4.0',
});

server.tool(
  'memory_write',
  'Write a memory entry. Default layer is "deep" for all detailed content. Use "light" ONLY for very short pointer entries (1 sentence max) that reference what is stored in deep memory, or for critical always-needed facts like active config values. Never store long content in light.',
  {
    content: z.string().describe('The memory content to store. For light entries: keep to 1 sentence. For deep entries: full detail.'),
    tags: z.array(z.string()).optional().describe('Tags for categorization and search. Required for deep entries — used to build the topic index.'),
    layer: z.enum(['light', 'deep']).optional().describe('"deep" (default): detailed content, fully searchable. "light": only short pointers or critical always-needed facts injected at every session start.'),
  },
  async ({ content, tags, layer }) => {
    const result = await handleWrite({ content, tags, layer });
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
);

server.tool(
  'memory_read_light',
  'Return all light-layer entries (pointers and critical facts). Use this when the user asks to "show memory", "what do you remember", "read project memory", or similar. For specific topics use memory_search instead. Already injected at session start — call this to refresh if needed.',
  {},
  () => {
    const entries = handleReadLight();
    return {
      content: [{ type: 'text', text: JSON.stringify(entries) }],
    };
  }
);

server.tool(
  'memory_search',
  'Hybrid semantic + keyword search across deep memory entries. Returns ranked results.',
  {
    query: z.string().describe('Search query'),
    limit: z.number().optional().describe('Maximum results to return (default: 10)'),
  },
  async ({ query, limit }) => {
    const results = await handleSearch({ query, limit });
    return {
      content: [{ type: 'text', text: JSON.stringify(results) }],
    };
  }
);

server.tool(
  'memory_delete',
  'Delete a memory entry by ID from either layer.',
  {
    id: z.string().describe('The entry ID to delete'),
  },
  ({ id }) => {
    const result = handleDelete({ id });
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
);

server.tool(
  'memory_read_all',
  'Return ALL entries from both layers — for memory management and cleanup only. Do NOT use this when the user asks to read or show memory (use memory_read_light instead). Only use when the user explicitly wants to audit, edit, or delete entries.',
  {},
  () => {
    const entries = handleReadAll();
    return {
      content: [{ type: 'text', text: JSON.stringify(entries) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
