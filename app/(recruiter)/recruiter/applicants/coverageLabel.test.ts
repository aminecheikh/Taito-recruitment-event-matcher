import { describe, expect, test } from "vitest";
import { coverageOptionLabel } from "./coverageLabel";

describe("coverageOptionLabel", () => {
  test("coverageOptionLabel_zero_showsEveryone", () => {
    expect(coverageOptionLabel(0, 3)).toBe("Show everyone");
  });
  test("coverageOptionLabel_noCoreRequirements_showsEveryoneNotAllZero", () => {
    expect(coverageOptionLabel(0, 0)).toBe("Show everyone");
  });
  test("coverageOptionLabel_partial_namesCoreRequirements", () => {
    expect(coverageOptionLabel(1, 3)).toBe("At least 1 of 3 core requirements");
  });
  test("coverageOptionLabel_all_namesCoreRequirements", () => {
    expect(coverageOptionLabel(3, 3)).toBe("All 3 core requirements");
  });
});
