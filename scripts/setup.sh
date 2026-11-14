#!/bin/sh
# One-time setup per clone (humans run it; agents may too). Safe to re-run.
#   scripts/setup.sh [your-name]     e.g. scripts/setup.sh amine
set -eu
root=$(git rev-parse --show-toplevel)
cd "$root"

git config core.hooksPath .githooks   # pre-commit secret/data scan, commit-msg, pre-push check
git config pull.rebase true           # linear history, fewer merge bubbles on main
git config rebase.autoStash true      # pull works even with uncommitted edits
git config fetch.prune true

name=${1:-$(git config team.member || git config user.name | awk '{print tolower($1)}')}
name=$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')
git config team.member "$name"

board="docs/team/$name.md"
if [ ! -f "$board" ]; then
  sed "s/<name>/$name/" docs/team/TEMPLATE.md > "$board"
  echo "Created $board: fill in Now, then commit and push it."
fi

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "Created .env from .env.example (AI_PROVIDER=mock). Add your own API key there if you need a real provider."
fi

command -v node >/dev/null || echo "warning: node not found. The agent hooks in .agents/hooks need Node 20+." >&2
echo "Setup done for '$name'. Hooks: .githooks. Check: scripts/check.sh"
