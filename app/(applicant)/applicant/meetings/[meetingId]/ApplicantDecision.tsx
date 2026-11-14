"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideAction, saveApplicantShareAction } from "@/app/actions/applicantMeetings";
import type { ShareChoice } from "@/lib/domain/shareInput";
import { meetingErrorText } from "../errors";

const BUTTON = "min-h-11 px-4 py-2";
const FIELD = "mt-1 min-h-11 w-full border border-neutral-700 bg-white px-2 text-neutral-900";

function ErrorNote({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="mt-2 border border-red-800 bg-red-50 p-3 text-red-900">
      {text}
    </p>
  );
}

export function DecisionButtons({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const decide = (value: boolean) =>
    start(async () => {
      const status = await decideAction(meetingId, value);
      if (!status.ok) return setError(meetingErrorText(status.error));
      router.refresh();
    });
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending} onClick={() => decide(true)} className={`${BUTTON} bg-neutral-900 text-white disabled:bg-neutral-200 disabled:text-neutral-700`}>
          Continue
        </button>
        <button type="button" disabled={pending} onClick={() => decide(false)} className={`${BUTTON} border border-neutral-700 text-neutral-900`}>
          Not this time
        </button>
      </div>
      <ErrorNote text={error} />
    </div>
  );
}

export function ShareForm({ meetingId, email, initial }: { meetingId: string; email: string; initial: ShareChoice }) {
  const [choice, setChoice] = useState<ShareChoice>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const update = (patch: Partial<ShareChoice>) => {
    setSaved(false);
    setChoice((c) => ({ ...c, ...patch }));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const status = await saveApplicantShareAction(meetingId, choice);
      setError(status.ok ? null : meetingErrorText(status.error));
      setSaved(status.ok);
    });
  };
  return (
    <form onSubmit={submit} className="mt-3 space-y-4">
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" className="size-5" checked={choice.shareEmail} onChange={(e) => update({ shareEmail: e.target.checked })} />
        Share my email ({email})
      </label>
      <div>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="size-5" checked={choice.shareCv} onChange={(e) => update({ shareCv: e.target.checked })} />
          Share a link to my CV
        </label>
        {choice.shareCv ? (
          <input type="url" aria-label="CV link" placeholder="https://" value={choice.cvUrl} onChange={(e) => update({ cvUrl: e.target.value })} className={FIELD} />
        ) : null}
      </div>
      <div>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" className="size-5" checked={choice.sharePortfolio} onChange={(e) => update({ sharePortfolio: e.target.checked })} />
          Share a link to my portfolio
        </label>
        {choice.sharePortfolio ? (
          <input type="url" aria-label="Portfolio link" placeholder="https://" value={choice.portfolioUrl} onChange={(e) => update({ portfolioUrl: e.target.value })} className={FIELD} />
        ) : null}
      </div>
      <button type="submit" disabled={pending} className={`${BUTTON} bg-neutral-900 text-white disabled:bg-neutral-200 disabled:text-neutral-700`}>
        Save what I share
      </button>
      {saved ? <p role="status" className="text-green-900">Saved. The company sees only what you ticked.</p> : null}
      <ErrorNote text={error} />
    </form>
  );
}
