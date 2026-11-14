"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptMeetingAction } from "@/app/actions/applicantMeetings";
import { slotEnd } from "@/lib/domain/calendar";
import { meetingErrorText } from "./errors";

export function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => router.refresh())}
      disabled={pending}
      className="btn"
    >
      {pending ? "Refreshing" : "Refresh"}
    </button>
  );
}

type AcceptProps = { meetingId: string; companyName: string; freeSlots: string[] };

export function AcceptButton({ meetingId, companyName, freeSlots }: AcceptProps) {
  const router = useRouter();
  const [slot, setSlot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const accept = () =>
    start(async () => {
      const status = await acceptMeetingAction(meetingId, slot);
      if (!status.ok) return setError(meetingErrorText(status.error));
      router.refresh();
    });
  return (
    <div className="mt-4">
      <label htmlFor={`slot-${meetingId}`} className="label">Choose a time</label>
      <select
        id={`slot-${meetingId}`}
        value={slot}
        onChange={(e) => setSlot(e.target.value)}
        className="field field-inline mb-3 block"
      >
        <option value="" disabled>Select a time</option>
        {freeSlots.map((start) => (
          <option key={start} value={start}>{`${start}\u2013${slotEnd(start)}`}</option>
        ))}
      </select>
      <button type="button" onClick={accept} disabled={pending || slot === ""} className="btn btn-primary">
        Accept meeting with {companyName}
      </button>
      {error ? (
        <p role="alert" className="notice notice-error mt-3">
          {error}
        </p>
      ) : null}
    </div>
  );
}
