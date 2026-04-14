#!/usr/bin/env bash

set -euo pipefail

API_KEY="${1:-${OPENAI_API_KEY:-}}"
PROJECT_DIR="${PWD}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/../../../packages/project-memory" && pwd)"
CODEX_DIR="$PROJECT_DIR/.codex"
CONFIG_PATH="$CODEX_DIR/config.toml"
SERVER_SCRIPT="$PLUGIN_DIR/scripts/start-mcp.sh"

(cd "$PACKAGE_DIR" && npm install --prefer-offline)
node --no-warnings "$PACKAGE_DIR/scripts/init-db.js" "$PROJECT_DIR"

mkdir -p "$CODEX_DIR"

CONFIG_PATH="$CONFIG_PATH" SERVER_SCRIPT="$SERVER_SCRIPT" API_KEY="$API_KEY" node --input-type=module <<'NODEJS'
import fs from 'node:fs';

const configPath = process.env.CONFIG_PATH;
const serverScript = process.env.SERVER_SCRIPT;
const apiKey = process.env.API_KEY;
const startMarker = '# BEGIN project-memory';
const endMarker = '# END project-memory';

const lines = [
  startMarker,
  '[mcp_servers.project-memory]',
  'command = "bash"',
  `args = ["${serverScript.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"]`,
];

if (apiKey) {
  lines.push('', '[mcp_servers.project-memory.env]');
  lines.push(`OPENAI_API_KEY = "${apiKey.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`);
}
lines.push(endMarker);
const block = `${lines.join('\n')}\n`;

let content = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}\\n?`, 'm');
if (regex.test(content)) {
  content = content.replace(regex, block);
} else {
  if (content && !content.endsWith('\n')) content += '\n';
  if (content) content += '\n';
  content += block;
}

fs.writeFileSync(configPath, content);
NODEJS

if ! grep -qxF '.codex/config.toml' "$PROJECT_DIR/.gitignore" 2>/dev/null; then
  printf '\n.codex/config.toml\n' >> "$PROJECT_DIR/.gitignore"
fi

cat <<EOF
Initialized project-memory for: $PROJECT_DIR
Database: $PROJECT_DIR/.memory/memory.db
Codex config: $CONFIG_PATH
Server script: $SERVER_SCRIPT
EOF
