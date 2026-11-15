"use client";

import { useEffect, useId, useRef } from "react";
import type { FilterReason } from "@/lib/domain/activeFilters";
import type { PopoverAction } from "@/lib/domain/reasonPopover";

type Props = {
  popoverKey: string;
  reasons: FilterReason[];
  open: boolean;
  dispatch: (action: PopoverAction) => void;
};

/**
 * Small "i" next to an applicant while an AI filter is active: hover for a quick look, click, tap,
 * Enter or Space to keep it open; Esc or a click outside closes it. Nothing without a reason.
 */
export function ReasonInfo({ popoverKey, reasons, open, dispatch }: Props) {
  const wrapper = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      dispatch({ type: "close" });
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) dispatch({ type: "close" });
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, dispatch]);

  if (reasons.length === 0) return null;

  return (
    <span
      ref={wrapper}
      className="relative inline-flex"
      onMouseEnter={() => dispatch({ type: "hover", key: popoverKey })}
      onMouseLeave={() => dispatch({ type: "leave", key: popoverKey })}
    >
      <button
        ref={button}
        type="button"
        className="inline-flex size-5 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-current text-xs font-bold leading-none text-muted hover:text-ink"
        aria-label="Why this applicant matches"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => dispatch({ type: "toggle", key: popoverKey })}
      >
        i
      </button>
      {open && (
        <span id={panelId} role="tooltip" className="ai-panel absolute left-0 top-full z-20 mt-2 block w-80 max-w-[80vw] !p-3 shadow-lg">
          <span className="tag tag-ai mb-2">AI reason</span>
          {reasons.map((r) => (
            <span key={r.label} className="mt-1 block">
              <span className="block text-sm font-semibold">{r.label}</span>
              <span className="block text-sm">{r.reason}</span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
