"use client";

import { useState, useTransition } from "react";
import { deleteMyDataAction } from "@/app/actions/privacy";

const CONFIRM_TEXT = "Delete all your stories, answers, signals and meetings? This cannot be undone.";

export function MyDataControls({ deleteEnabled }: { deleteEnabled: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!window.confirm(CONFIRM_TEXT)) return;
    startTransition(async () => {
      const status = await deleteMyDataAction();
      setFailed(!status.ok);
      setMessage(status.ok ? "Your data has been deleted. Pick an applicant in the top bar to continue." : status.error);
    });
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <a className="btn" href="/api/me/export" download="taito-my-data.json">Download my data</a>
      <button type="button" className="btn btn-danger" onClick={remove} disabled={pending || !deleteEnabled}>Delete all my data</button>
      {deleteEnabled ? null : <p className="hint">Deleting is turned off on the shared demo.</p>}
      {message ? <p role={failed ? "alert" : "status"} className={failed ? "font-medium text-danger" : "font-medium text-success"}>{message}</p> : null}
    </div>
  );
}
