/** Viewer's colour theme. No cookie means "follow the system" (Light or Dark). */
export const THEMES = ["light", "bright", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "theme";
export const THEME_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  bright: "Bright",
  dark: "Dark",
};

/** Accepts only a known theme; anything else falls back to following the system. */
export function parseTheme(raw: string | undefined): Theme | undefined {
  return THEMES.find((theme) => theme === raw);
}
