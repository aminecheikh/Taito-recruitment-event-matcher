#!/usr/bin/env node
// PreToolUse(Bash) guard shared by Claude Code (.claude/settings.json) and Codex (.codex/hooks.json).
// Both send {tool_input: {command}} on stdin and accept the same "deny" JSON on stdout.
// It only denies: Codex has no "ask", and a hackathon team can't afford prompts.
// It stops accidents (lost work, broken main, leaked keys), not someone deliberately hiding a command.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { pathToFileURL } from "node:url";

const PROTECTED = /^(main|master)$/;
const SECRET_FILE = /(^|\/)(\.env(\.[\w.-]+)?|[^/]+\.(pem|key|p12)|id_(rsa|ed25519|ecdsa))$/;
const SECRET_TEMPLATE = /\.env\.(example|sample|template)$/;
const PRINTERS = new Set(["cat", "head", "tail", "less", "more", "bat", "grep", "rg", "awk", "sed", "source", ".", "xxd", "base64", "strings", "jq"]);
const WRAPPERS = new Set(["sudo", "env", "time", "nohup", "command", "exec"]);
const SHELLS = new Set(["bash", "sh", "zsh"]);

const ASK_HUMAN = "If it's really needed, ask the human to run it themselves (`! <cmd>` in Claude, or their own terminal).";
const REASONS = {
  forceMain: `Force-pushing main rewrites everyone's history. Pull --rebase and push normally (AGENTS.md › Git). ${ASK_HUMAN}`,
  noVerify: "Skipping git hooks is not allowed. Fix what the hook reports; they are fast (AGENTS.md › Git).",
  discard: `This throws away uncommitted work, which may be a teammate's or another agent's. Commit or stash first. ${ASK_HUMAN}`,
  deleteMain: `Deleting main is never needed. ${ASK_HUMAN}`,
  addForce: "`git add -f` adds ignored files such as .env or generated data. Not allowed.",
  secret: "Secrets stay out of the conversation. Refer to the variable by name; the human sets the values (AGENTS.md › Secrets).",
};

function readQuoted(text, start) {
  const quote = text[start];
  let index = start + 1;
  let value = "";
  while (index < text.length && text[index] !== quote) {
    if (quote === '"' && text[index] === "\\") index += 1;
    value += text[index] ?? "";
    index += 1;
  }
  return { value, end: index };
}

/** `a && b | c; $(d)` → [["a"], ["b"], ["c"], ["d"]], with `bash -c '...'` unwrapped. */
export function segments(command) {
  const result = [[]];
  let word = "";
  let inWord = false;
  const endWord = () => {
    if (inWord) result.at(-1).push(word);
    word = "";
    inWord = false;
  };
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    if (char === "'" || char === '"') {
      const { value, end } = readQuoted(command, index);
      word += value;
      inWord = true;
      index = end;
    } else if (char === "\\") {
      word += command[index + 1] ?? "";
      inWord = true;
      index += 1;
    } else if (char === " " || char === "\t" || char === "<" || char === ">") {
      endWord();
    } else if (";&|()`\n".includes(char) || (char === "$" && command[index + 1] === "(")) {
      endWord();
      result.push([]);
    } else {
      word += char;
      inWord = true;
    }
  }
  endWord();
  return result.flatMap(unwrap);
}

function unwrap(words) {
  let start = 0;
  while (start < words.length && (WRAPPERS.has(words[start]) || /^[A-Za-z_]\w*=/.test(words[start]))) start += 1;
  const rest = words.slice(start);
  if (rest.length === 0) return [];
  const flag = rest.indexOf("-c");
  if (SHELLS.has(basename(rest[0])) && flag > 0 && rest[flag + 1]) return segments(rest[flag + 1]);
  return [rest];
}

const hasFlag = (args, long, short) =>
  args.includes(long) || (short && args.some((arg) => /^-[a-zA-Z]+$/.test(arg) && arg.includes(short)));
const positionals = (args) => args.filter((arg) => !arg.startsWith("-"));

function checkPush(args, branch) {
  if (args.includes("--no-verify")) return REASONS.noVerify;
  const refs = positionals(args).slice(1);
  if (args.includes("--delete") && refs.some((ref) => PROTECTED.test(ref))) return REASONS.deleteMain;
  if (refs.some((ref) => /^:(main|master)$/.test(ref))) return REASONS.deleteMain;
  const force = args.some((arg) => arg.startsWith("--force")) || hasFlag(args, "", "f") || refs.some((ref) => ref.startsWith("+"));
  if (!force) return null;
  const targets = refs.map((ref) => ref.replace(/^\+/, "").split(":").pop().replace(/^refs\/heads\//, ""));
  const hitsMain = targets.length === 0 ? PROTECTED.test(branch) : targets.some((t) => PROTECTED.test(t === "HEAD" ? branch : t));
  return hitsMain ? REASONS.forceMain : null;
}

function checkGit(sub, args, branch) {
  switch (sub) {
    case "push":
      return checkPush(args, branch);
    case "commit":
      return hasFlag(args, "--no-verify", "n") ? REASONS.noVerify : null;
    case "add":
      return hasFlag(args, "--force", "f") ? REASONS.addForce : null;
    case "reset":
      return args.includes("--hard") ? REASONS.discard : null;
    case "clean":
      return hasFlag(args, "--force", "f") ? REASONS.discard : null;
    case "checkout":
      return args.includes("--") && args.includes(".") ? REASONS.discard : null;
    case "restore":
      return !args.includes("--staged") && positionals(args).includes(".") ? REASONS.discard : null;
    case "stash":
      return ["clear", "drop"].includes(args[0]) ? REASONS.discard : null;
    case "branch":
      return hasFlag(args, "--delete", "D") && positionals(args).some((name) => PROTECTED.test(name)) ? REASONS.deleteMain : null;
    default:
      return null;
  }
}

function checkSegment(words, branch) {
  const name = basename(words[0]);
  if (PRINTERS.has(name) && words.slice(1).some((w) => SECRET_FILE.test(w) && !SECRET_TEMPLATE.test(w))) return REASONS.secret;
  if (name !== "git") return null;
  let index = 1;
  while (index < words.length && words[index].startsWith("-")) index += ["-C", "-c"].includes(words[index]) ? 2 : 1;
  return checkGit(words[index] ?? "", words.slice(index + 1), branch);
}

/** The reason to deny `command`, or null to let it run. */
export function checkCommand(command, { branch }) {
  for (const words of segments(command)) {
    const reason = checkSegment(words, branch);
    if (reason) return reason;
  }
  return null;
}

function currentBranch(cwd) {
  try {
    return execFileSync("git", ["-C", cwd, "branch", "--show-current"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function main() {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const command = input.tool_input?.command;
  if (typeof command !== "string") return;
  const reason = checkCommand(command, { branch: currentBranch(input.cwd ?? process.cwd()) });
  if (!reason) return;
  const output = { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } };
  process.stdout.write(JSON.stringify(output));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`guard.mjs failed open: ${error.message}\n`);
  }
}
