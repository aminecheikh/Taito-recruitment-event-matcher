"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptMeetingAction } from "@/app/actions/applicantMeetings";
import { meetingErrorText } from "./errors";

const BUTTON = "min-h-11 px-4 py-2";

export function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => router.refresh())}
      disabled={pending}
      className={`${BUTTON} border border-neutral-700 text-neutral-900`}
    >
      {pending ? "Refreshing" : "Refresh"}
    </button>
  );
}

export function AcceptButton({ meetingId, companyName }: { meetingId: string; companyName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const accept = () =>
    start(async () => {
      const status = await acceptMeetingAction(meetingId);
      if (!status.ok) return setError(meetingErrorText(status.error));
      router.refresh();
    });
  return (
    <div className="mt-3">
      <button type="button" onClick={accept} disabled={pending} className={`${BUTTON} bg-neutral-900 text-white disabled:bg-neutral-200 disabled:text-neutral-700`}>
        Accept meeting with {companyName}
      </button>
      {error ? (
        <p role="alert" className="mt-2 border border-red-800 bg-red-50 p-3 text-red-900">
          {error}
        </p>
      ) : null}
    </div>
  );
}
