---
name: ship
description: Get a working change onto main fast and safely - run the check, make a conventional commit, pull --rebase, resolve conflicts, push. Use whenever a slice works ("ship it", "push", "commit this"), and at least every 30-60 minutes of work.
---

# Ship — small, green, often

We are trunk-based: everyone pushes to `main`. Main must always run, because teammates pull it every few minutes.

1. **Slice.** Ship the smallest piece that works on its own (a component that renders, an endpoint with its test). Half-done work stays behind a flag or out of the commit. Unrelated edits go in separate commits.
2. **Check.** `scripts/check.sh`. Fix failures, never bypass (`--no-verify` is blocked). If the app has a dev command, open the page/endpoint you changed once.
3. **Commit.** Stage named files (`git add path/…`, not blind `git add -A` if other agents share this checkout). Conventional message: `feat(cards): evidence card form`, `fix(api): …`, `data: …`, `docs: …`, `chore: …`. The commit-msg hook enforces the format.
4. **Rebase.** `git pull --rebase`. On a conflict:
   - Read both sides. Keep both intents; a teammate's change is not noise.
   - Lockfiles: take theirs, then reinstall (`npm install` / `uv sync`) and re-stage.
   - Generated files: regenerate rather than hand-merge.
   - If you can't tell what the other side meant, stop and ask the human, naming the teammate from `git log -1 <their sha>`.
   - `git add <files> && git rebase --continue`, then re-run `scripts/check.sh`.
5. **Push.** `git push` (the pre-push hook runs the check again). Rejected because main moved? Repeat step 4. Never force-push main.
6. **Tell.** Update **Now/Next** in your `docs/team/<you>.md` if the task is done, and push it together with or right after the change. If the change alters a decision, run the `decide` skill.

Risky spike (big refactor, new framework)? Use a short branch `feat/<thing>` and merge it the same day; or an isolated worktree: `git worktree add .claude/worktrees/<thing> -b feat/<thing>`.
