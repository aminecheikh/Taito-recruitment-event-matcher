import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ReasonInfo } from "./ReasonInfo";

const noop = () => {};
const REASONS = [{ label: "Python evidence", reason: 'Wrote "cleaned sensor data with pandas".' }];

describe("ReasonInfo", () => {
  test("reasonInfo_noReason_rendersNothing", () => {
    expect(renderToStaticMarkup(<ReasonInfo popoverKey="a" reasons={[]} open={false} dispatch={noop} />)).toBe("");
  });

  test("reasonInfo_withReason_closed_showsLabelledButtonOnly", () => {
    const html = renderToStaticMarkup(<ReasonInfo popoverKey="a" reasons={REASONS} open={false} dispatch={noop} />);
    expect(html).toContain('aria-label="Why this applicant matches"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("<button");
    expect(html).not.toContain("cleaned sensor data");
  });

  test("reasonInfo_open_showsReasonsGroupedByFilter", () => {
    const html = renderToStaticMarkup(<ReasonInfo popoverKey="a" reasons={REASONS} open dispatch={noop} />);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="tooltip"');
    expect(html).toContain("Python evidence");
    expect(html).toContain("cleaned sensor data with pandas");
  });
});
