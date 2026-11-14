#!/usr/bin/env node
// SessionStart hook shared by Claude Code and Codex: plain text on stdout becomes session context.
// Also runnable by hand: `node .agents/hooks/session-start.mjs`.
// Tells the agent where the branch stands against origin and what each teammate is doing.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..", "..");
const TEAM_DIR = join(ROOT, "docs", "team");
const RECENT_COMMITS = 8;
const FETCH_TIMEOUT_MS = 4000;

function git(args, timeout = 2000) {
  try {
    return execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8", timeout, stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

/** Lowercase first word, letters only: "Mohamed Amine Cheikh" → "mohamed". */
export function slug(name) {
  return (name.trim().split(/\s+/)[0] ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/** Lines with content under `## heading` in a markdown text (skips comments and empty bullets). */
export function section(markdown, heading) {
  const lines = [];
  let inside = false;
  for (const line of markdown.split("\n")) {
    const text = line.trim();
    if (line.startsWith("## ")) {
      inside = line.slice(3).trim().toLowerCase() === heading.toLowerCase();
    } else if (inside && text && text !== "-" && !text.startsWith("<!--")) {
      lines.push(line);
    }
  }
  return lines.join("\n");
}

function syncStatus(branch) {
  git(["fetch", "--quiet", "origin"], FETCH_TIMEOUT_MS);
  const counts = git(["rev-list", "--left-right", "--count", `HEAD...origin/${branch}`]);
  const dirty = git(["status", "--porcelain"]).split("\n").filter(Boolean).length;
  const [ahead, behind] = counts ? counts.split(/\s+/).map(Number) : [];
  const parts = [`Branch \`${branch || "(detached)"}\``];
  parts.push(counts ? `${ahead} ahead / ${behind} behind origin` : "no upstream yet (or offline)");
  parts.push(`${dirty} uncommitted file(s)`);
  const advice = behind > 0 ? "\n→ Run `git pull --rebase` before editing." : "";
  return parts.join(", ") + "." + advice;
}

function teamBoard(me) {
  if (!existsSync(TEAM_DIR)) return "";
  const files = readdirSync(TEAM_DIR).filter((file) => file.endsWith(".md") && !["README.md", "TEMPLATE.md"].includes(file));
  const blocks = files.map((file) => {
    const name = file.replace(/\.md$/, "");
    const text = readFileSync(join(TEAM_DIR, file), "utf8");
    const now = section(text, "Now") || "-";
    const asks = section(text, "Asks");
    const label = name === me ? `${name} (you)` : name;
    return `### ${label}\nNow:\n${now}${asks ? `\nAsks:\n${asks}` : ""}`;
  });
  return `## Team board (docs/team/)\n${blocks.join("\n\n") || "(empty)"}`;
}

/** First-run instructions when this clone skipped `scripts/setup.sh` (AGENTS.md › First run); "" when set up. */
export function setupWarning({ hooksPath, member, hasBoard }) {
  const problems = [];
  if (hooksPath !== ".githooks") problems.push("git hooks are off (no secret scan, no pre-push check)");
  if (!member) problems.push("`git config team.member` is not set");
  if (!hasBoard) problems.push(`no board file docs/team/${member || "<name>"}.md`);
  if (problems.length === 0) return "";
  const command = `scripts/setup.sh ${member || "<name>"}`;
  const askName = member ? "" : " Ask the human which short name they use on the team board (e.g. their first name) before running it.";
  return [
    "## ⚠ FIRST RUN: this clone is not set up",
    `Problems: ${problems.join("; ")}.`,
    `Before any other work, run \`${command}\`.${askName}`,
    "Then fill in Now in their board and push it (skill: sync). Codex users: also run /hooks once to trust .codex/hooks.json.",
  ].join("\n");
}

export function briefing() {
  const branch = git(["branch", "--show-current"]);
  const member = git(["config", "team.member"]);
  const me = member || slug(git(["config", "user.name"])) || "unknown";
  const log = git(["log", `-${RECENT_COMMITS}`, "--format=%h %an, %ar: %s", `origin/${branch || "main"}`]) || git(["log", `-${RECENT_COMMITS}`, "--format=%h %an, %ar: %s"]);
  const hasBoard = Boolean(member) && existsSync(join(TEAM_DIR, `${member}.md`));
  return [
    setupWarning({ hooksPath: git(["config", "core.hooksPath"]), member, hasBoard }),
    `# Hackathon session briefing (you work with: ${me})`,
    syncStatus(branch),
    `## Latest commits on origin\n${log || "(none yet)"}`,
    teamBoard(me),
    "Before a big edit, check that nobody's Now overlaps it. Run the skills in AGENTS.md › Skills on your own whenever their trigger fits (sync, ship, responsible-ai-check, decide, …); the humans won't always ask.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.stdout.write(briefing() + "\n");
  } catch (error) {
    process.stderr.write(`session-start.mjs failed: ${error.message}\n`);
  }
}
