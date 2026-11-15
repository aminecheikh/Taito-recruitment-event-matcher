/** Wording for the coverage filter: how many of the company's core requirements a card must have an example for. */
export function coverageOptionLabel(min: number, total: number): string {
  if (min <= 0) return "Show everyone";
  if (min >= total) return `All ${total} core requirements`;
  return `At least ${min} of ${total} core requirements`;
}
