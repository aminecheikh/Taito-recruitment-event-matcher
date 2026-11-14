# Team board

One file per person: `docs/team/<name>.md`, created by `scripts/setup.sh <name>`. Only its owner edits it, so boards never cause merge conflicts.

| Section | What goes there |
|---|---|
| **Now** | What you (and your agents) are building right now, with the files/folders it touches |
| **Next** | What you'll pick up after |
| **Asks** | Questions or requests for teammates. They delete them when answered |

Claude Code and Codex print every board at session start (`.agents/hooks/session-start.mjs`), so an agent knows what the others are touching before it edits. Run it by hand any time: `node .agents/hooks/session-start.mjs`.
