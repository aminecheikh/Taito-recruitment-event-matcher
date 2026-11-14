#!/bin/sh
# The one gate before pushing (also run by .githooks/pre-push). Keep it under ~60 s.
# Stack-agnostic: it runs whatever each package defines, so it keeps working once a stack is picked.
#   Node package (package.json):      npm run lint / typecheck / test, each only if defined
#   Python package (pyproject.toml):  ruff check + pytest, each only if listed in pyproject.toml
set -eu
root=$(git rev-parse --show-toplevel)
cd "$root"

step() { printf '\n▶ %s\n' "$1"; }

step "agent hooks (node --test)"
node --test '.agents/hooks/*.test.mjs' >/dev/null 2>&1 || node --test '.agents/hooks/*.test.mjs'

packages=$(find . -maxdepth 3 \( -name node_modules -o -name .venv -o -name .git -o -name .claude \) -prune -o \
  \( -name package.json -o -name pyproject.toml \) -print | xargs -n1 dirname 2>/dev/null | sort -u)

for dir in $packages; do
  if [ -f "$dir/package.json" ]; then
    for script in lint typecheck test; do
      if grep -q "\"$script\"[[:space:]]*:" "$dir/package.json"; then
        step "$dir: npm run $script"
        (cd "$dir" && npm run --silent "$script")
      fi
    done
  fi
  if [ -f "$dir/pyproject.toml" ]; then
    if grep -q ruff "$dir/pyproject.toml"; then step "$dir: ruff"; (cd "$dir" && uv run ruff check .); fi
    if grep -q pytest "$dir/pyproject.toml"; then step "$dir: pytest"; (cd "$dir" && uv run pytest -q); fi
  fi
done

printf '\n✔ check passed\n'
