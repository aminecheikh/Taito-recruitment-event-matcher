/**
 * Taito's mascots: two original 1930s-cartoon characters drawn in Finnish blue and white with
 * pink. One wears a pipo (knitted beanie with a pom-pom and a Nordic zigzag); the other the white
 * Finnish student cap (ylioppilaslakki). Parts are plain SVG with `m-*` classes styled in
 * globals.css, so the same drawings serve the foreground stickers and the faint backdrop.
 * Everything here is decoration: callers mark it aria-hidden.
 */

export type Hat = "pipo" | "lakki";
type Fill = "blue" | "pink" | "paper" | "white" | "ice";

export const at = (x: number, y: number, rotate = 0, flip = false, scale = 1) =>
  `translate(${x} ${y})${rotate ? ` rotate(${rotate})` : ""}${flip ? " scale(-1 1)" : ""}${scale !== 1 ? ` scale(${scale})` : ""}`;

/** A rubber-hose limb: an outlined tube in one colour. */
function Tube({ d, fill }: { d: string; fill: Fill }) {
  return (
    <g>
      <path d={d} className="m-tube-out" />
      <path d={d} className={`m-tube-in m-tube-${fill}`} />
    </g>
  );
}

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <g transform={at(x, y)}>
      <ellipse rx={5.5} ry={9} className="m-blue" />
      <path d="M1 -2 L6 -9.5 L6 -1 Z" className="m-paper" />
    </g>
  );
}

function Mouth({ talking }: { talking?: boolean }) {
  if (talking) {
    return (
      <g>
        <path d="M-12 10 Q0 30 12 10 Q0 15 -12 10 Z" className="m-blue m-edge" />
        <path d="M-6 19 Q0 15 6 19 Q0 24 -6 19 Z" className="m-pink" />
      </g>
    );
  }
  return (
    <g>
      <path d="M-13 11 Q0 24 13 10" className="m-line" />
      <path d="M14 7 q3 2 1 6" className="m-line m-thin" />
    </g>
  );
}

function Pipo() {
  return (
    <g>
      <path d="M-31 -4 C-34 -50 34 -50 31 -4 Z" className="m-pink m-edge" />
      <path d="M-34 -12 Q0 -21 34 -12 L34 2 Q0 -7 -34 2 Z" className="m-paper m-edge" />
      <path d="M-28 -5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5" className="m-line m-thin" />
      <circle cy={-47} r={9} className="m-paper m-edge" />
      <path d="M-3 -50 l2 3 M3 -49 l-1 3" className="m-line m-thin" />
    </g>
  );
}

function Lakki() {
  return (
    <g>
      <path d="M-30 -6 C-37 -30 -24 -47 2 -47 C27 -47 37 -32 30 -6 Z" className="m-white m-edge" />
      <path d="M-31 -14 Q0 -20 31 -14 L31 -3 Q0 -9 -31 -3 Z" className="m-blue m-edge" />
      <path d="M4 -5 Q24 -9 42 -1 Q26 5 6 1 Z" className="m-blue m-edge" />
      <circle cx={-2} cy={-25} r={4.5} className="m-pink m-edge" />
    </g>
  );
}

/** Head in three-quarter view facing right; origin at the centre of the face. */
export function Head({ hat, talking }: { hat: Hat; talking?: boolean }) {
  return (
    <g>
      <path d="M-28 0 C-41 -5 -41 17 -27 15" className="m-paper m-edge" />
      <path
        d="M-30 4 C-32 -26 -14 -36 4 -35 C24 -34 33 -20 32 2 C31 24 18 36 0 36 C-18 36 -29 24 -30 4 Z"
        className="m-paper m-edge"
      />
      <path d="M-4 -14 Q2 -19 8 -15 M12 -16 Q18 -20 24 -15" className="m-line m-thin" />
      <Eye x={3} y={-2} />
      <Eye x={18} y={-3} />
      <path d="M25 4 C33 4 33 12 25 12" className="m-line" />
      <g transform={at(9, 5)}>
        <Mouth talking={talking} />
      </g>
      <g transform={at(0, -14)}>{hat === "pipo" ? <Pipo /> : <Lakki />}</g>
    </g>
  );
}

/** Sweater torso from the neck (0,0) down 62 units, with a knitted yoke. */
function Sweater({ fill }: { fill: "blue" | "pink" }) {
  return (
    <g>
      <path d="M-20 0 C-31 6 -33 34 -30 62 L30 62 C33 34 31 6 20 0 Z" className={`m-${fill} m-edge`} />
      <path
        d="M-27 17 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6"
        className={fill === "blue" ? "m-line-paper m-thin" : "m-line m-thin"}
      />
      <path d="M-12 1 Q0 9 12 1" className={fill === "blue" ? "m-line-paper" : "m-line"} />
    </g>
  );
}

export function Glove({ x, y }: { x: number; y: number }) {
  return (
    <g transform={at(x, y)}>
      <circle r={9} className="m-white m-edge" />
      <path d="M-3 -4 v6 M2 -5 v6" className="m-line m-thin" />
    </g>
  );
}

function Boot({ x, y }: { x: number; y: number }) {
  return <path transform={at(x, y)} d="M-14 0 C-14 -11 4 -13 10 -7 C19 -7 23 0 19 5 L-14 5 Z" className="m-blue m-edge" />;
}

/** Laptop with its lid facing the viewer; a small pine tree on the lid. Origin: front of the base. */
function Laptop() {
  return (
    <g>
      <path d="M-36 0 L-30 -56 L32 -56 L28 0 Z" className="m-ice m-edge" />
      <path d="M0 -42 L-8 -28 h5 l-7 11 h20 l-7 -11 h5 Z" className="m-blue" />
      <path d="M-42 0 H38 L34 7 H-38 Z" className="m-blue m-edge" />
    </g>
  );
}

/** Kuksa, the Finnish wooden cup, with steam. Origin: bottom of the cup. */
export function Kuksa({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={at(x, y, 0, false, scale)}>
      <path d="M-4 -24 C-9 -30 1 -34 -4 -42 M5 -24 C0 -30 10 -34 5 -42" className="m-line m-thin" />
      <path d="M-15 -16 Q-15 0 0 0 Q15 0 15 -16 Z" className="m-pink m-edge" />
      <path d="M15 -16 C28 -18 28 -4 14 -5" className="m-line" />
      <circle cx={21} cy={-11} r={2} className="m-blue" />
    </g>
  );
}

export function SpeechBubble({ x, y, text, tail = "left" }: { x: number; y: number; text: string; tail?: "left" | "right" }) {
  const w = 22 + text.length * 15;
  const tx = tail === "left" ? 16 : w - 16;
  return (
    <g transform={at(x, y)}>
      <path d={`M${tx - 8} 38 L${tail === "left" ? tx - 12 : tx + 12} 56 L${tx + 8} 38 Z`} className="m-white m-edge" />
      <rect width={w} height={42} rx={21} className="m-white m-edge" />
      <text x={w / 2} y={29} textAnchor="middle" className="m-text">
        {text}
      </text>
    </g>
  );
}

/** Sitting on an edge (y = 0 is the seat), typing on a laptop, legs dangling over the front. */
export function LaptopPose({ hat = "pipo", sweater = "blue" }: { hat?: Hat; sweater?: "blue" | "pink" }) {
  return (
    <g>
      <Tube d="M-22 -56 C-34 -36 -28 -14 -16 -8" fill={sweater} />
      <Tube d="M22 -56 C33 -36 24 -14 12 -8" fill={sweater} />
      <g transform={at(0, -66)}>
        <Sweater fill={sweater} />
      </g>
      <Tube d="M-12 -2 C-14 14 -16 30 -15 44" fill="blue" />
      <Tube d="M10 -2 C18 12 30 20 44 18" fill="blue" />
      <Boot x={-12} y={46} />
      <g transform={at(52, 14, -35)}>
        <Boot x={0} y={0} />
      </g>
      <g transform={at(0, -2)}>
        <Laptop />
      </g>
      <Glove x={-30} y={-8} />
      <g transform={at(0, -104)}>
        <Head hat={hat} />
      </g>
      <Kuksa x={58} y={0} />
    </g>
  );
}

/** Standing and talking, facing right; origin on the ground between the boots. */
export function TalkPose({ hat, sweater }: { hat: Hat; sweater: "blue" | "pink" }) {
  return (
    <g>
      <Tube d="M-9 -64 C-10 -44 -12 -24 -12 -8" fill="blue" />
      <Tube d="M9 -64 C10 -44 12 -24 13 -8" fill="blue" />
      <Boot x={-14} y={-5} />
      <Boot x={14} y={-5} />
      <Tube d="M-20 -118 C-34 -100 -34 -82 -26 -72" fill={sweater} />
      <g transform={at(0, -126)}>
        <Sweater fill={sweater} />
      </g>
      <Tube d="M20 -118 C40 -126 50 -140 54 -154" fill={sweater} />
      <Glove x={-25} y={-68} />
      <Glove x={55} y={-158} />
      <g transform={at(0, -162)}>
        <Head hat={hat} talking />
      </g>
    </g>
  );
}

/** Peeking over an edge at y = 0: the face rises above it and two gloves grip it. */
export function PeekPose({ clipId, hat = "lakki" }: { clipId: string; hat?: Hat }) {
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={-90} y={-120} width={180} height={120} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g transform={at(0, -20)}>
          <Head hat={hat} />
        </g>
      </g>
      <Glove x={-34} y={0} />
      <Glove x={40} y={0} />
    </g>
  );
}

/** White sticker outline around a drawing, like a die-cut sticker. */
export function StickerFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="grown" />
      <feFlood floodColor="#ffffff" />
      <feComposite in2="grown" operator="in" result="outline" />
      <feMerge>
        <feMergeNode in="outline" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
