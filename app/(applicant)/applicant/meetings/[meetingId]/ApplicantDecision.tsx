"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideAction, saveApplicantShareAction } from "@/app/actions/applicantMeetings";
import type { ShareChoice } from "@/lib/domain/shareInput";
import { meetingErrorText } from "../errors";

const FIELD = "field mt-1 ml-8 w-[calc(100%-2rem)]";

function ErrorNote({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="notice notice-error mt-3">
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
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending} onClick={() => decide(true)} className="btn btn-primary">
          Continue
        </button>
        <button type="button" disabled={pending} onClick={() => decide(false)} className="btn">
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
    <form onSubmit={submit} className="panel mt-5 space-y-3">
      <label className="choice">
        <input type="checkbox" checked={choice.shareEmail} onChange={(e) => update({ shareEmail: e.target.checked })} />
        Share my email ({email})
      </label>
      <div>
        <label className="choice">
          <input type="checkbox" checked={choice.shareCv} onChange={(e) => update({ shareCv: e.target.checked })} />
          Share a link to my CV
        </label>
        {choice.shareCv ? (
          <input type="url" aria-label="CV link" placeholder="https://" value={choice.cvUrl} onChange={(e) => update({ cvUrl: e.target.value })} className={FIELD} />
        ) : null}
      </div>
      <div>
        <label className="choice">
          <input type="checkbox" checked={choice.sharePortfolio} onChange={(e) => update({ sharePortfolio: e.target.checked })} />
          Share a link to my portfolio
        </label>
        {choice.sharePortfolio ? (
          <input type="url" aria-label="Portfolio link" placeholder="https://" value={choice.portfolioUrl} onChange={(e) => update({ portfolioUrl: e.target.value })} className={FIELD} />
        ) : null}
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary">
        Save what I share
      </button>
      {saved ? <p role="status" className="font-medium text-success">Saved. The company sees only what you ticked.</p> : null}
      <ErrorNote text={error} />
    </form>
  );
}
