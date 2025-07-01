#!/bin/bash
set -euo pipefail

# ┌───────────────────────────────────────────────────────────────┐
# │           Harmony/RateCast Custom Environment Setup           │
# │                                                               │
# │ Author: Stephen Dedola                                        │
# │ Purpose: Override Codex auto-generated scripts that inject    │
# │          malformed shell lines (e.g., `tecast API ...`)       │
# │                                                               │
# │ This script performs the following:                           │
# │ 1. Detects and neutralizes bad injected lines in temp scripts │
# │ 2. Enforces script integrity with SHA-256 checks              │
# │ 3. Prevents re-execution via lockfile                         │
# └───────────────────────────────────────────────────────────────┘

# SPDX-License-Identifier: MIT

LOCK_FILE=".setup_env.lock"
if [[ -f "$LOCK_FILE" ]]; then
  echo "🛑 setup_env.sh has already run. Remove $LOCK_FILE to run again."
  exit 0
fi

echo "✅ Custom environment setup starting..."

# Protect this script from unwanted rewrites by Codex or tooling
readonly SCRIPT_PATH="$(realpath "${BASH_SOURCE[0]}")"
readonly SCRIPT_HASH_ORIGINAL="$(shasum -a 256 "$SCRIPT_PATH")"

# Clean any injected temp scripts
TEMP_SCRIPT=$(ls /tmp/*setup_script.sh 2>/dev/null | head -n1 || true)

if [[ -f "$TEMP_SCRIPT" ]]; then
  echo "🧼 Cleaning up bad line in $TEMP_SCRIPT..."
  sed -i '' '/tecast API/ s/^/#/' "$TEMP_SCRIPT"
fi

# Lock integrity
SCRIPT_HASH_AFTER="$(shasum -a 256 "$SCRIPT_PATH")"
if [[ "$SCRIPT_HASH_ORIGINAL" != "$SCRIPT_HASH_AFTER" ]]; then
  echo "🚨 Warning: setup_env.sh was modified during execution."
else
  echo "🔒 Script integrity verified."
fi

# Run safe setup
echo "📦 Installing dependencies..."
yarn install

echo "✅ Setup complete."

touch "$LOCK_FILE"
