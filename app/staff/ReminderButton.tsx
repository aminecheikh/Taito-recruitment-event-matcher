"use client";

import { useState, useTransition } from "react";
import { sendReminderAction } from "@/app/actions/reminders";

type Props = {
  companyId: string;
  name: string;
  kind: "set-requirements" | "join-event";
  label: string;
  alreadySent: boolean;
};

export function ReminderButton({ companyId, name, kind, label, alreadySent }: Props) {
  const [sent, setSent] = useState(alreadySent);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return <span className="tag tag-success min-h-11 px-4">{kind === "join-event" ? "Invited" : "Reminded"}</span>;
  }

  function send() {
    startTransition(async () => {
      const status = await sendReminderAction(companyId, kind);
      if (status.ok || status.alreadySent) setSent(true);
      else setError(status.error);
    });
  }

  return (
    <>
      <button type="button" onClick={send} disabled={pending} aria-label={`${label} ${name}`} className="btn btn-primary">
        {label}
      </button>
      {error ? <span role="alert" className="notice-error ml-2">{error}</span> : null}
    </>
  );
}
