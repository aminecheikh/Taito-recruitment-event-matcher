import { Kuksa, LaptopPose, SpeechBubble, TalkPose, at } from "./mascots";

/**
 * Backdrop: the mascots in a few quiet Finnish scenes (typing on a bench, a "Moi!" / "Hei!"
 * greeting, pines by a lake, a kuksa, a "Sisu!" starburst), tiled faintly behind every page and
 * scrolling with it. Purely decorative: hidden from assistive tech, no pointer events.
 */

const TILE_W = 1600;
const TILE_H = 1300;

function burstPoints(points: number, outer: number, inner: number) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const radius = i % 2 ? inner : outer;
    return `${(radius * Math.cos(angle)).toFixed(1)},${(radius * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");
}

const BURST = burstPoints(14, 62, 48);

function Pine({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={at(x, y, 0, false, scale)}>
      <path d="M-5 16 h10 v18 h-10 Z" className="m-blue" />
      <path d="M0 -90 L-22 -50 h10 L-30 -16 h12 L-38 16 h76 L18 -16 h12 L12 -50 h10 Z" className="m-ice m-edge" />
    </g>
  );
}

function Snowflake({ x, y }: { x: number; y: number }) {
  return <path transform={at(x, y)} d="M0 -10 V10 M-9 -5 L9 5 M-9 5 L9 -5" className="m-line m-thin" />;
}

function Tile() {
  return (
    <g>
      <g transform={at(240, 400)}>
        <path d="M-80 10 L-76 70 M110 10 L106 70" className="m-line" />
        <rect x={-90} y={0} width={210} height={12} rx={4} className="m-pink m-edge" />
        <LaptopPose hat="pipo" sweater="blue" />
      </g>

      <g transform={at(930, 600)}>
        <TalkPose hat="pipo" sweater="pink" />
        <g transform={at(170, 0, 0, true)}>
          <TalkPose hat="lakki" sweater="blue" />
        </g>
        <SpeechBubble x={-60} y={-290} text="Moi!" />
        <SpeechBubble x={150} y={-280} text="Hei!" tail="right" />
      </g>

      <g transform={at(200, 1150)}>
        <path d="M-60 40 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 M-30 60 q20 -10 40 0 t40 0 t40 0 t40 0" className="m-line" />
        <Pine x={0} y={0} />
        <Pine x={70} y={-10} scale={1.25} />
        <Pine x={150} y={6} scale={0.85} />
      </g>

      <Kuksa x={1420} y={330} scale={1.7} />

      <g transform={at(760, 1080, -8)}>
        <polygon points={BURST} transform="translate(6 6)" className="m-line" />
        <polygon points={BURST} className="m-pink m-edge" />
        <text y={10} textAnchor="middle" className="m-text">
          Sisu!
        </text>
      </g>

      <Snowflake x={620} y={160} />
      <Snowflake x={1240} y={900} />
      <Snowflake x={1500} y={1180} />
      <Snowflake x={80} y={720} />
    </g>
  );
}

export function SceneBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg width="100%" height="100%" focusable="false" className="mascot-art">
        <defs>
          <pattern id="taito-scenes" width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
            <Tile />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#taito-scenes)" />
      </svg>
    </div>
  );
}
