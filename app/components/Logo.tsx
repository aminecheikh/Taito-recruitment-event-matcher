import { Head, StickerFilter } from "./mascots";

/** The Taito lockup: the pipo mascot's head as a sticker mark beside a chunky cobalt wordmark. */
export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="-48 -84 96 126" className="logo-mark mascot-art" aria-hidden="true" focusable="false">
        <defs>
          <StickerFilter id="logo-sticker" />
        </defs>
        <g filter="url(#logo-sticker)">
          <Head hat="pipo" />
        </g>
      </svg>
      <span className="logo-word">Taito</span>
    </span>
  );
}
