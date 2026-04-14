#!/usr/bin/env bash

set -euo pipefail

API_KEY="${1:-${OPENAI_API_KEY:-}}"
PROJECT_DIR="${PWD}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/../../../packages/project-memory" && pwd)"
MCP_PATH="$PROJECT_DIR/.mcp.json"
SERVER_SCRIPT="$PLUGIN_DIR/scripts/start-mcp.sh"

(cd "$PACKAGE_DIR" && npm install --prefer-offline)
node --no-warnings "$PACKAGE_DIR/scripts/init-db.js" "$PROJECT_DIR"

PROJECT_DIR="$PROJECT_DIR" MCP_PATH="$MCP_PATH" SERVER_SCRIPT="$SERVER_SCRIPT" API_KEY="$API_KEY" node --input-type=module <<'NODEJS'
import fs from 'node:fs';

const mcpPath = process.env.MCP_PATH;
const serverScript = process.env.SERVER_SCRIPT;
const apiKey = process.env.API_KEY;

let payload = {};
if (fs.existsSync(mcpPath)) {
  payload = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
}
if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
  payload = {};
}
if (!payload.mcpServers || typeof payload.mcpServers !== 'object' || Array.isArray(payload.mcpServers)) {
  payload.mcpServers = {};
}

payload.mcpServers['project-memory'] = {
  command: 'bash',
  args: [serverScript],
};

if (apiKey) {
  payload.mcpServers['project-memory'].env = {
    OPENAI_API_KEY: apiKey,
  };
}

fs.writeFileSync(mcpPath, `${JSON.stringify(payload, null, 2)}\n`);
NODEJS

if ! grep -qxF '.mcp.json' "$PROJECT_DIR/.gitignore" 2>/dev/null; then
  printf '\n.mcp.json\n' >> "$PROJECT_DIR/.gitignore"
fi

cat <<EOF
Initialized project-memory for: $PROJECT_DIR
Database: $PROJECT_DIR/.memory/memory.db
MCP config: $MCP_PATH
Server script: $SERVER_SCRIPT
EOF
