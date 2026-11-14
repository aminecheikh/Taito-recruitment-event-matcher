import assert from "node:assert/strict";
import { test } from "node:test";

import { section, setupWarning, slug } from "./session-start.mjs";

test("test_setupWarning_when_clone_fully_set_up_expect_empty", () => {
  assert.equal(setupWarning({ hooksPath: ".githooks", member: "amine", hasBoard: true }), "");
});

test("test_setupWarning_when_fresh_clone_expect_first_run_instructions", () => {
  const warning = setupWarning({ hooksPath: "", member: "", hasBoard: false });
  assert.match(warning, /FIRST RUN/);
  assert.match(warning, /scripts\/setup\.sh <name>/);
  assert.match(warning, /git hooks are off/);
  assert.match(warning, /ask the human/i);
});

test("test_setupWarning_when_only_board_missing_expect_named_setup_command", () => {
  const warning = setupWarning({ hooksPath: ".githooks", member: "sara", hasBoard: false });
  assert.match(warning, /scripts\/setup\.sh sara/);
  assert.doesNotMatch(warning, /git hooks are off/);
});

const BOARD = `# alex

## Now
- evidence-card form (src/cards/)

<!-- one line per item -->
## Next
- seed data

## Asks
- someone review the matching copy
`;

test("test_section_when_heading_present_expect_its_lines_only", () => {
  assert.equal(section(BOARD, "Now"), "- evidence-card form (src/cards/)");
  assert.equal(section(BOARD, "asks"), "- someone review the matching copy");
});

test("test_section_when_heading_missing_expect_empty", () => {
  assert.equal(section(BOARD, "Blocked"), "");
});

test("test_section_when_only_empty_template_bullet_expect_empty", () => {
  assert.equal(section("## Now\n- \n\n## Next\n", "Now"), "");
});

test("test_slug_when_full_name_expect_lowercase_first_word", () => {
  assert.equal(slug("Mohamed Amine Cheikh"), "mohamed");
  assert.equal(slug("  Åsa "), "sa");
  assert.equal(slug(""), "");
});
