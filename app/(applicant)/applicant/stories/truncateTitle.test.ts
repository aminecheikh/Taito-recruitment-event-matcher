import { describe, expect, it } from "vitest";
import { truncateTitle } from "./truncateTitle";

describe("truncateTitle", () => {
  it("test_truncateTitle_shortText_returnsUnchanged", () => {
    expect(truncateTitle("Led a team")).toBe("Led a team");
  });

  it("test_truncateTitle_longText_cutsAtWordBoundaryWithinLimit", () => {
    const out = truncateTitle("word ".repeat(100));
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith("word…")).toBe(true);
  });

  it("test_truncateTitle_noSpaces_hardCuts", () => {
    const out = truncateTitle("x".repeat(500));
    expect(out).toHaveLength(200);
    expect(out.endsWith("…")).toBe(true);
  });
});
