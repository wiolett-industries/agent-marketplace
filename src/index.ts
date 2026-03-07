import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { handleWrite } from './tools/write.js';
import { handleGet } from './tools/get.js';
import { handleReadLight } from './tools/read-light.js';
import { handleSearch } from './tools/search.js';
import { handleDelete } from './tools/delete.js';
import { handleReadAll } from './tools/read-all.js';

const server = new McpServer({
  name: 'project-memory',
  version: '1.7.0',
});

server.tool(
  'memory_write',
  'Save a memory. Always saves full content to deep layer and automatically creates a light pointer entry linking back to it via ID. Use the optional summary param for a concise 1-sentence pointer label — otherwise the first 160 chars of content are used. Pass layer="light" only for standalone critical facts that have no deep counterpart.',
  {
    content: z.string().describe('Full content to store in deep memory.'),
    tags: z.array(z.string()).optional().describe('Tags for search and topic index. Use descriptive keywords.'),
    summary: z.string().optional().describe('Short 1-sentence label for the auto-created light pointer. If omitted, first 160 chars of content are used.'),
    layer: z.enum(['light', 'deep']).optional().describe('Default: "deep" — saves to deep and auto-creates light pointer. Use "light" only for standalone critical facts with no deep counterpart.'),
  },
  async ({ content, tags, summary, layer }) => {
    const result = await handleWrite({ content, tags, summary, layer });
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  }
);

server.tool(
  'memory_get',
  'Fetch the full content of a specific deep memory entry by ID. Use this when you see a light pointer like "[→ abc123] ..." and need the full details.',
  {
    id: z.string().describe('The deep entry ID from a light pointer (the part after "→ ")'),
  },
  ({ id }) => {
    const entry = handleGet({ id });
    return {
      content: [{ type: 'text', text: JSON.stringify(entry) }],
    };
  }
);

server.tool(
  'memory_read_light',
  'Return all light-layer entries (pointers and critical facts). Already injected at session start — call this to explicitly refresh. When the user asks to "show memory" or "what do you remember", use this tool.',
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
  'Hybrid semantic + keyword search across deep memory entries. Use when you need to find entries by topic but don\'t have a specific ID.',
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
  'Delete a memory entry by ID. If deleting a deep entry, its auto-created light pointer is also deleted automatically.',
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
  'Return ALL entries from both layers — for memory management and cleanup only. Do NOT use when the user asks to read or show memory (use memory_read_light instead).',
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
