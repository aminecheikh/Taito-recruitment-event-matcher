/**
 * Cartoon backdrop: original 1930s rubber-hose style scenes (hose limbs, pie-cut eyes, gloves,
 * big shoes) about meeting people, tiled faintly behind every page. Purely decorative: hidden
 * from assistive tech, no pointer events, colours from the theme tokens so it follows Light/Dark.
 */

const TILE_W = 1400;
const TILE_H = 1100;

type Tone = "sun" | "tangerine" | "bubblegum";
type Hat = "bowler" | "bow" | "cap";
type Pose = "shake" | "hold" | "wave";

const at = (x: number, y: number, flip = false, rotate = 0) =>
  `translate(${x} ${y})${rotate ? ` rotate(${rotate})` : ""}${flip ? " scale(-1 1)" : ""}`;

function PieEye({ x, y }: { x: number; y: number }) {
  return (
    <g transform={at(x, y)}>
      <ellipse rx={5} ry={9} className="d-ink" />
      <path d="M0.5 -1 L5.5 -9 L5.5 -1 Z" className="d-paper" />
    </g>
  );
}

function HatShape({ hat }: { hat?: Hat }) {
  if (hat === "bowler") {
    return (
      <g>
        <path d="M-20 -20 C-20 -54 20 -54 20 -20 Z" className="d-ink" />
        <path d="M-32 -19 Q0 -27 32 -19" className="d-stroke" />
      </g>
    );
  }
  if (hat === "bow") {
    return (
      <g transform={at(15, -26, false, 20)}>
        <path d="M0 0 L-15 -10 L-15 10 Z M0 0 L15 -10 L15 10 Z" className="d-bubblegum d-edge" />
        <circle r={4} className="d-ink" />
      </g>
    );
  }
  if (hat === "cap") {
    return (
      <g>
        <path d="M-26 -12 C-26 -44 26 -44 26 -12 Z" className="d-tangerine d-edge" />
        <path d="M22 -13 L46 -9" className="d-hose" />
      </g>
    );
  }
  return null;
}

function Head({ x, y, hat }: { x: number; y: number; hat?: Hat }) {
  return (
    <g transform={at(x, y)}>
      <circle r={28} className="d-paper d-edge" />
      <PieEye x={-9} y={-4} />
      <PieEye x={9} y={-4} />
      <ellipse cy={8} rx={6} ry={4} className="d-ink" />
      <path d="M-14 13 Q0 29 14 13" className="d-stroke" />
      <HatShape hat={hat} />
    </g>
  );
}

function Glove({ x, y }: { x: number; y: number }) {
  return (
    <g transform={at(x, y)}>
      <circle r={8.5} className="d-paper d-edge" />
      <path d="M-3 -3 V2 M1.5 -4 V2" className="d-thin" />
    </g>
  );
}

function Body({ x, y, tone }: { x: number; y: number; tone: Tone }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={22} ry={27} className={`d-${tone} d-edge`} />
      <circle cx={x} cy={y - 7} r={2.5} className="d-ink" />
      <circle cx={x} cy={y + 5} r={2.5} className="d-ink" />
    </g>
  );
}

/** Seated figure facing right; origin is the top of the stool. */
function Sitter({ x, y, tone, hat, flip, talking }: { x: number; y: number; tone: Tone; hat?: Hat; flip?: boolean; talking?: boolean }) {
  return (
    <g transform={at(x, y, flip)}>
      <path d="M-12 0 L-17 46 M12 0 L17 46" className="d-stroke" />
      <rect x={-21} y={-4} width={42} height={8} rx={4} className="d-ink" />
      <path d="M-6 -8 C8 -6 26 -8 30 30 M6 -10 C18 -8 38 -10 44 28" className="d-hose" />
      <ellipse cx={34} cy={34} rx={14} ry={6.5} className="d-ink" />
      <ellipse cx={48} cy={32} rx={14} ry={6.5} className="d-ink" />
      <Body x={0} y={-32} tone={tone} />
      <path d="M-15 -40 C-32 -22 -24 -8 -12 -6" className="d-hose" />
      <Glove x={-11} y={-6} />
      {talking ? (
        <>
          <path d="M16 -42 C34 -52 42 -68 46 -80" className="d-hose" />
          <Glove x={47} y={-84} />
        </>
      ) : (
        <>
          <path d="M16 -38 C34 -32 46 -32 58 -32" className="d-hose" />
          <Glove x={62} y={-32} />
        </>
      )}
      <Head x={0} y={-86} hat={hat} />
    </g>
  );
}

/** Standing figure facing right; origin is the ground between the shoes. */
function Stander({ x, y, tone, hat, flip, pose }: { x: number; y: number; tone: Tone; hat?: Hat; flip?: boolean; pose: Pose }) {
  return (
    <g transform={at(x, y, flip)}>
      <path d="M-8 -40 C-10 -24 -14 -12 -16 -2 M8 -40 C10 -24 14 -12 16 -2" className="d-hose" />
      <ellipse cx={-22} cy={1} rx={15} ry={7} className="d-ink" />
      <ellipse cx={24} cy={1} rx={15} ry={7} className="d-ink" />
      <Body x={0} y={-64} tone={tone} />
      {pose === "hold" ? (
        <>
          <path d="M-16 -80 C-30 -102 -30 -130 -26 -150 M16 -80 C30 -102 30 -130 26 -150" className="d-hose" />
          <Glove x={-26} y={-154} />
          <Glove x={26} y={-154} />
        </>
      ) : (
        <>
          <path d="M-18 -72 C-36 -60 -34 -46 -26 -42" className="d-hose" />
          <Glove x={-24} y={-40} />
          {pose === "shake" ? (
            <>
              <path d="M18 -72 C36 -74 46 -66 56 -62" className="d-hose" />
              <Glove x={60} y={-62} />
            </>
          ) : (
            <>
              <path d="M18 -76 C34 -92 38 -112 40 -130" className="d-hose" />
              <Glove x={41} y={-134} />
            </>
          )}
        </>
      )}
      <Head x={0} y={-118} hat={hat} />
    </g>
  );
}

function Sparkle({ x, y, s = 1, tone = "sun" }: { x: number; y: number; s?: number; tone?: Tone }) {
  return (
    <path
      transform={`${at(x, y)} scale(${s})`}
      d="M0 -12 Q2 -2 12 0 Q2 2 0 12 Q-2 2 -12 0 Q-2 -2 0 -12 Z"
      className={`d-${tone} d-edge`}
    />
  );
}

function Heart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`${at(x, y)} scale(${s})`}
      d="M0 5 C-11 -4 -9 -15 0 -8 C9 -15 11 -4 0 5 Z"
      className="d-bubblegum d-edge"
    />
  );
}

function Bubble({ x, y, w, h, tailX, children }: { x: number; y: number; w: number; h: number; tailX: number; children: React.ReactNode }) {
  return (
    <g transform={at(x, y)}>
      <path d={`M${tailX - 8} ${h - 4} L${tailX - 14} ${h + 18} L${tailX + 10} ${h - 4} Z`} className="d-paper d-edge" />
      <rect width={w} height={h} rx={h / 2} className="d-paper d-edge" />
      {children}
    </g>
  );
}

function Cup({ x, y }: { x: number; y: number }) {
  return (
    <g transform={at(x, y)}>
      <path d="M-2 -18 C-7 -24 3 -28 -2 -36" className="d-thin" />
      <path d="M-9 -12 H9 L7 4 H-7 Z" className="d-paper d-edge" />
      <path d="M9 -8 C15 -8 15 0 8 0" className="d-stroke" />
    </g>
  );
}

function ChatScene() {
  return (
    <g>
      <path d="M210 -38 V42 M188 42 H232" className="d-stroke" />
      <ellipse cx={210} cy={-40} rx={54} ry={10} className="d-tangerine d-edge" />
      <Cup x={192} y={-50} />
      <Cup x={230} y={-50} />
      <Sitter x={110} y={0} tone="sun" hat="bowler" talking />
      <Sitter x={310} y={0} tone="bubblegum" hat="bow" flip />
      <Bubble x={54} y={-206} w={96} h={52} tailX={70}>
        <circle cx={30} cy={26} r={5} className="d-ink" />
        <circle cx={48} cy={26} r={5} className="d-ink" />
        <circle cx={66} cy={26} r={5} className="d-ink" />
      </Bubble>
      <Bubble x={292} y={-196} w={84} h={52} tailX={30}>
        <Sparkle x={42} y={26} s={1.3} />
      </Bubble>
    </g>
  );
}

function MeetingScene() {
  const people: { x: number; tone: Tone; hat?: Hat }[] = [
    { x: 90, tone: "sun", hat: "cap" },
    { x: 200, tone: "tangerine" },
    { x: 310, tone: "bubblegum", hat: "bowler" },
  ];
  return (
    <g>
      {people.map((p) => (
        <g key={p.x}>
          <Body x={p.x} y={-26} tone={p.tone} />
          <Head x={p.x} y={-80} hat={p.hat} />
        </g>
      ))}
      <rect x={0} y={-8} width={400} height={16} rx={5} className="d-ink" />
      <path d="M24 8 L16 74 M376 8 L384 74" className="d-hose" />
      {people.map((p) => (
        <g key={`arms-${p.x}`}>
          <path d={`M${p.x - 16} -34 C${p.x - 28} -24 ${p.x - 26} -14 ${p.x - 20} -12`} className="d-hose" />
          <path d={`M${p.x + 16} -34 C${p.x + 28} -24 ${p.x + 26} -14 ${p.x + 20} -12`} className="d-hose" />
          <Glove x={p.x - 20} y={-12} />
          <Glove x={p.x + 20} y={-12} />
        </g>
      ))}
      <g transform={at(140, -16, false, -8)}>
        <rect x={-14} y={-10} width={28} height={18} rx={2} className="d-paper d-edge" />
        <path d="M-8 -3 H8 M-8 2 H4" className="d-thin" />
      </g>
      <Cup x={252} y={-12} />
      <g transform={at(450, -166)}>
        <path d="M20 100 L4 176 M114 100 L130 176 M67 100 V170" className="d-stroke" />
        <rect width={134} height={104} rx={8} className="d-paper d-edge" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={at(24, 24 + i * 28)}>
            <circle r={9} className={i === 0 ? "d-sun d-edge" : "d-paper d-edge"} />
            <path d="M18 0 H88" className="d-stroke" />
            {i < 2 ? <path d="M-5 0 L-1 4 L6 -5" className="d-stroke" /> : null}
          </g>
        ))}
      </g>
    </g>
  );
}

function HandshakeScene() {
  return (
    <g>
      <Stander x={0} y={0} tone="tangerine" hat="cap" pose="shake" />
      <Stander x={124} y={0} tone="sun" pose="shake" flip />
      <Sparkle x={62} y={-102} s={0.9} tone="bubblegum" />
      <Sparkle x={34} y={-206} s={0.7} />
      <Heart x={96} y={-212} s={1.1} />
    </g>
  );
}

function StoryScene() {
  return (
    <g>
      <g transform={at(0, -198, false, -6)}>
        <rect x={-66} y={-46} width={132} height={86} rx={8} className="d-paper d-edge" />
        <circle cx={-40} cy={-20} r={11} className="d-sun d-edge" />
        <path d="M-20 -22 H46 M-50 2 H46 M-50 20 H28" className="d-stroke" />
      </g>
      <Stander x={0} y={0} tone="bubblegum" hat="bow" pose="hold" />
    </g>
  );
}

function Clock({ x, y }: { x: number; y: number }) {
  return (
    <g transform={at(x, y)}>
      <circle cx={-16} cy={-22} r={8} className="d-tangerine d-edge" />
      <circle cx={16} cy={-22} r={8} className="d-tangerine d-edge" />
      <circle r={26} className="d-paper d-edge" />
      <path d="M0 0 V-15 M0 0 L11 6" className="d-stroke" />
      <path d="M-14 24 L-20 34 M14 24 L20 34" className="d-hose" />
    </g>
  );
}

function Plane({ x, y }: { x: number; y: number }) {
  return (
    <g transform={at(x, y, false, -12)}>
      <path d="M-70 18 C-50 30 -36 6 -14 10" className="d-thin" strokeDasharray="4 8" />
      <path d="M0 0 L46 -16 L16 12 Z" className="d-paper d-edge" />
      <path d="M16 12 L18 -2 L46 -16" className="d-stroke" />
    </g>
  );
}

function QuestionBubble({ x, y }: { x: number; y: number }) {
  return (
    <Bubble x={x} y={y} w={60} h={56} tailX={18}>
      <path d="M24 18 C24 10 38 10 38 18 C38 25 31 25 31 32" className="d-stroke" />
      <circle cx={31} cy={41} r={3} className="d-ink" />
    </Bubble>
  );
}

function Tile() {
  return (
    <g>
      <g transform={at(60, 320, false, -2)}>
        <ChatScene />
      </g>
      <g transform={at(740, 250, false, 2)}>
        <MeetingScene />
      </g>
      <g transform={at(200, 820)}>
        <HandshakeScene />
      </g>
      <g transform={at(700, 1040, false, 3)}>
        <StoryScene />
      </g>
      <g transform={at(1200, 1000)}>
        <Stander x={0} y={0} tone="tangerine" hat="bowler" pose="wave" />
      </g>
      <Sparkle x={560} y={110} s={1.4} />
      <Sparkle x={1330} y={170} tone="tangerine" />
      <Heart x={110} y={560} s={1.3} />
      <Clock x={1310} y={560} />
      <Plane x={470} y={560} />
      <QuestionBubble x={980} y={700} />
      <Sparkle x={980} y={960} s={0.8} tone="bubblegum" />
    </g>
  );
}

export function SceneBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg width="100%" height="100%" focusable="false">
        <defs>
          <pattern id="hiring-scenes" width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
            <Tile />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hiring-scenes)" />
      </svg>
    </div>
  );
}
