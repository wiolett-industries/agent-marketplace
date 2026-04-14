#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/../../../packages/project-memory" && pwd)"
TSX_BIN="$PACKAGE_DIR/node_modules/.bin/tsx"

if [ ! -x "$TSX_BIN" ]; then
  echo "project-memory dependencies are not installed. Run: (cd \"$PACKAGE_DIR\" && npm install)" >&2
  exit 1
fi

exec "$TSX_BIN" "$PACKAGE_DIR/src/index.ts"
