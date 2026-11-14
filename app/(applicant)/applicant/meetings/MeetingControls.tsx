"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptMeetingAction } from "@/app/actions/applicantMeetings";
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
    <div className="mt-4">
      <button type="button" onClick={accept} disabled={pending} className="btn btn-primary">
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
