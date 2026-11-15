export const MAX_TITLE_CHARS = 200;

/** Cuts a prefilled story title to the limit at a word boundary, adding an ellipsis when cut. */
export function truncateTitle(text: string, max = MAX_TITLE_CHARS): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const lastSpace = room.lastIndexOf(" ");
  const cut = lastSpace > 0 ? room.slice(0, lastSpace) : room;
  return `${cut.trimEnd()}…`;
}
