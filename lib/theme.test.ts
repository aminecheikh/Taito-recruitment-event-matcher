import { describe, expect, it } from "vitest";
import { parseTheme } from "./theme";

describe("parseTheme", () => {
  it("test_parseTheme_knownValue_returnsIt", () => {
    expect(parseTheme("bright")).toBe("bright");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
  });

  it("test_parseTheme_missingOrUnknown_returnsUndefined", () => {
    expect(parseTheme(undefined)).toBeUndefined();
    expect(parseTheme("")).toBeUndefined();
    expect(parseTheme("cream\" onload=\"x")).toBeUndefined();
  });
});
