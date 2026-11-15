"use client";

import { coverageOptionLabel } from "./coverageLabel";

/** The coverage dropdown applies as soon as an option is picked, so the list never looks out of date. */
export function CoverageSelect({ min, total }: { min: number; total: number }) {
  const options = Array.from({ length: total + 1 }, (_, i) => total - i);
  return (
    <select
      id="min"
      name="min"
      defaultValue={String(min)}
      className="field field-inline"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {options.map((n) => (
        <option key={n} value={n}>
          {coverageOptionLabel(n, total)}
        </option>
      ))}
    </select>
  );
}
