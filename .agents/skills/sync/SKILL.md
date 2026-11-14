---
name: sync
description: Start or resume work without colliding with teammates - pull, read the team board, claim a task in docs/team/<you>.md and push the claim. Use at the start of a session, when switching tasks, or when asked "what is everyone doing" / "what should I work on".
---

# Sync — claim before you build

Goal: in under two minutes, know what changed, what others are touching, and announce what you'll touch.

1. **Pull.** `git pull --rebase`. If it stops on a conflict, resolve it (see the `ship` skill, step 4) before anything else.
2. **Read the room.** `node .agents/hooks/session-start.mjs` prints ahead/behind, the latest commits and every teammate's board. Skim `git log --stat -5` if a recent commit touches the area you're about to work on.
3. **Pick a task.** Prefer, in order: an Ask addressed to you, the item in your own board's Next, then a gap from `docs/pipeline.md` "open problems". If unclear, ask the human — don't invent scope.
4. **Check overlap.** If someone's Now names the same files or feature, stop and tell the human: "X is on `src/cards/`; I'll take Y instead or coordinate?" Never silently rewrite code a teammate committed in the last hour.
5. **Claim it.** Edit only your own `docs/team/<you>.md` (`git config team.member` gives your name; `scripts/setup.sh <name>` creates the file). Under **Now**, write one line: what + which folders. Move done items out.
6. **Push the claim at once**, alone: `git add docs/team/<you>.md && git commit -m "chore(team): <you> on <task>" && git push`. Claims are only useful if others see them.

Keep it light: the board is a few lines, not a status report.
