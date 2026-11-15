"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setMovingHelpAction } from "@/app/actions/movingHelp";

export function MovingHelpToggle({ initial, children }: { initial: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function change(next: boolean) {
    setOn(next);
    setError(null);
    start(async () => {
      const result = await setMovingHelpAction(next);
      if (!result.ok) {
        setOn(!next);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="panel mt-10">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1"
          checked={on}
          disabled={pending}
          onChange={(e) => change(e.target.checked)}
        />
        <span>
          <span className="block font-semibold">
            I&apos;m moving to Finland or new here and would like help with permits and moving
          </span>
          <span className="hint block">Companies only see this after you both decide to continue.</span>
        </span>
      </label>
      {error ? <p className="notice-error mt-3">{error}</p> : null}
      {on ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
