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
  version: '1.0.0',
});

server.tool(
  'memory_write',
  'Write or update a memory entry. Computes and stores an embedding for semantic search. Default layer is "deep".',
  {
    content: z.string().describe('The memory content to store'),
    tags: z.array(z.string()).optional().describe('Optional tags for categorization'),
    layer: z.enum(['light', 'deep']).optional().describe('"light" for always-available high-priority context, "deep" for searchable knowledge store (default)'),
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
  'Return all light-layer entries instantly (no search). Use at conversation start for immediate project context.',
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
  'Return all entries from both layers without embeddings. Useful for memory management.',
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
