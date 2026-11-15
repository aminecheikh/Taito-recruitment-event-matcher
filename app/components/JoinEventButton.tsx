"use client";

import { useState, useTransition } from "react";
import { joinEventAction } from "@/app/actions/reminders";

export function JoinEventButton({ eventId }: { eventId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function join() {
    startTransition(async () => {
      const status = await joinEventAction(eventId);
      setError(status.ok ? null : status.error);
    });
  }

  return (
    <>
      <button type="button" onClick={join} disabled={pending} className="btn btn-primary">
        Join event
      </button>
      {error ? <p role="alert" className="notice-error mt-2">{error}</p> : null}
    </>
  );
}
