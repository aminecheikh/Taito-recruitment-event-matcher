// Run: node --test .agents/hooks/
import assert from "node:assert/strict";
import { test } from "node:test";

import { checkCommand } from "./guard.mjs";

const onMain = (command) => checkCommand(command, { branch: "main" });
const onFeature = (command) => checkCommand(command, { branch: "feat/cards" });

test("test_checkCommand_when_everyday_git_expect_allowed", () => {
  for (const command of [
    "git status",
    "git pull --rebase",
    "git add -A && git commit -m 'feat: cards'",
    "git push",
    "git push origin main",
    "git log --oneline -5 | head",
  ]) {
    assert.equal(onMain(command), null, command);
  }
});

test("test_checkCommand_when_force_push_to_main_expect_denied", () => {
  for (const command of [
    "git push --force",
    "git push -f origin main",
    "git push origin +main",
    "git push --force-with-lease origin HEAD:main",
    "cd x && git push -f",
  ]) {
    assert.match(onMain(command) ?? "", /main/, command);
  }
});

test("test_checkCommand_when_force_push_own_branch_expect_allowed", () => {
  assert.equal(onFeature("git push --force-with-lease"), null);
  assert.equal(onMain("git push --force-with-lease origin feat/cards"), null);
});

test("test_checkCommand_when_skipping_git_hooks_expect_denied", () => {
  assert.ok(onFeature("git commit --no-verify -m 'x'"));
  assert.ok(onFeature("git commit -nm 'x'"));
  assert.ok(onFeature("git push --no-verify"));
});

test("test_checkCommand_when_discarding_uncommitted_work_expect_denied", () => {
  for (const command of ["git reset --hard", "git clean -fd", "git checkout -- .", "git restore .", "git stash clear"]) {
    assert.ok(onFeature(command), command);
  }
  assert.equal(onFeature("git restore --staged notes.md"), null);
  assert.equal(onFeature("git reset HEAD~1"), null);
});

test("test_checkCommand_when_deleting_main_or_adding_ignored_expect_denied", () => {
  assert.ok(onFeature("git branch -D main"));
  assert.ok(onFeature("git push origin --delete main"));
  assert.ok(onFeature("git add -f .env"));
});

test("test_checkCommand_when_printing_secret_file_expect_denied", () => {
  assert.ok(onFeature("cat .env"));
  assert.ok(onFeature("grep KEY backend/.env.local"));
  assert.ok(onFeature("bash -c 'source .env && env'"));
  assert.equal(onFeature("cat .env.example"), null);
  assert.equal(onFeature("cp .env.example .env"), null);
});
