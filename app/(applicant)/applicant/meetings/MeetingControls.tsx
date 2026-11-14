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
      {freeSlots.length === 0 ? (
        <p className="notice">There is no time left that suits both calendars, so this request cannot be booked.</p>
      ) : (
        <fieldset>
          <legend className="label">Choose a time with {companyName}</legend>
          <div className="mt-2 mb-3 grid gap-2 sm:grid-cols-2">
            {freeSlots.map((start) => (
              <label key={start} className="slot-option">
                <input
                  type="radio"
                  name={`slot-${meetingId}`}
                  value={start}
                  checked={slot === start}
                  onChange={() => setSlot(start)}
                />
                {`${start}\u2013${slotEnd(start)}`}
              </label>
            ))}
          </div>
          <button type="button" onClick={accept} disabled={pending || slot === ""} className="btn btn-primary">
            Book this time
          </button>
        </fieldset>
      )}
      {error ? (
        <p role="alert" className="notice notice-error mt-3">
          {error}
        </p>
      ) : null}
    </div>
  );
}
