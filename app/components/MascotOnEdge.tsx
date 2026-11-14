import { LaptopPose, PeekPose, SpeechBubble, StickerFilter } from "./mascots";

/** Each pose's viewBox and where its edge line (y = 0) sits, in viewBox units from the top. */
const POSES = {
  laptop: { minX: -84, minY: -186, w: 190, h: 246 },
  peek: { minX: -160, minY: -116, w: 220, h: 130 },
} as const;

type Pose = keyof typeof POSES;

/**
 * A mascot sticker that interacts with the box it is placed in: sitting on its top edge or
 * peeking over it. The parent must be `position: relative`. Decorative only.
 */
export function MascotOnEdge({ pose, id, width, side, inset }: { pose: Pose; id: string; width: number; side: "left" | "right"; inset: string }) {
  const box = POSES[pose];
  const edgeFromTop = (-box.minY / box.w) * width;
  return (
    <svg
      viewBox={`${box.minX} ${box.minY} ${box.w} ${box.h}`}
      width={width}
      aria-hidden="true"
      focusable="false"
      className="mascot-art mascot-on-edge max-sm:scale-[0.8]"
      style={{ top: -edgeFromTop, [side]: inset, transformOrigin: `${side} ${edgeFromTop}px` }}
    >
      <defs>
        <StickerFilter id={`${id}-sticker`} />
      </defs>
      <g filter={`url(#${id}-sticker)`}>
        {pose === "laptop" ? (
          <LaptopPose hat="pipo" sweater="blue" />
        ) : (
          <g>
            <PeekPose clipId={`${id}-clip`} hat="lakki" />
            <SpeechBubble x={-150} y={-104} text="Moi!" tail="right" />
          </g>
        )}
      </g>
    </svg>
  );
}
