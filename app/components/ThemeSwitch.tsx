"use client";

import { useState, useSyncExternalStore } from "react";
import { THEME_COOKIE, THEME_LABELS, THEME_MAX_AGE_SECONDS, THEMES, type Theme } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeSystem(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_MAX_AGE_SECONDS}; samesite=lax`;
}

/** Light (stone), Bright (cream) or Dark. Until the viewer picks one, the system setting decides. */
export function ThemeSwitch({ initial }: { initial?: Theme }) {
  const [chosen, setChosen] = useState<Theme | undefined>(initial);
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
  const active: Theme = chosen ?? (systemDark ? "dark" : "light");

  const choose = (theme: Theme) => {
    setChosen(theme);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calm || !("startViewTransition" in document)) return apply(theme);
    document.startViewTransition(() => apply(theme));
  };

  return (
    <div role="group" aria-label="Colour theme" className="seg">
      {THEMES.map((theme) => (
        <button
          key={theme}
          type="button"
          aria-pressed={active === theme}
          onClick={() => choose(theme)}
          className="seg-btn"
        >
          {THEME_LABELS[theme]}
        </button>
      ))}
    </div>
  );
}
