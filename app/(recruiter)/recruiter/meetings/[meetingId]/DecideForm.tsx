"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideAction, shareCompanyDetailsAction } from "@/app/actions/meetings";

type Req = { id: string; text: string };

const input = "field";
const primary = "btn btn-primary";

function ErrorText({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="notice notice-error mt-3">
      {message}
    </p>
  ) : null;
}

export function DecideForm({ meetingId, requirements }: { meetingId: string; requirements: Req[] }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [choice, setChoice] = useState<"continue" | "stop" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!choice) return setError("Choose Continue or Not this time.");
    setError(null);
    start(async () => {
      const status = await decideAction(meetingId, { scores, continue: choice === "continue", feedback });
      if (!status.ok) setError(status.error);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="card mt-8 space-y-5">
      <div>
        <h2 className="h2">Score the conversation</h2>
        <p className="hint mt-1">Your own score, 0 to 10, per core requirement. It informs your answer; it never decides it.</p>
      </div>
      {requirements.map((r) => (
        <div key={r.id} className="border-t border-line pt-4">
          <label htmlFor={`s-${r.id}`} className="block font-semibold">
            {r.text}
          </label>
          <select
            id={`s-${r.id}`}
            required
            value={scores[r.id] === undefined ? "" : String(scores[r.id])}
            onChange={(e) => setScores({ ...scores, [r.id]: Number(e.target.value) })}
            className={`${input} mt-1 max-w-xs`}
          >
            <option value="" disabled>
              Choose 0 to 10
            </option>
            {Array.from({ length: 11 }, (_, n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {choice === "stop" && (
            <>
              <label htmlFor={`f-${r.id}`} className="hint mt-3 block">
                Feedback line for the applicant on this requirement
              </label>
              <input
                id={`f-${r.id}`}
                required
                value={feedback[r.id] ?? ""}
                onChange={(e) => setFeedback({ ...feedback, [r.id]: e.target.value })}
                className={`${input} mt-1`}
              />
            </>
          )}
        </div>
      ))}
      <fieldset className="border-t border-line pt-5">
        <legend className="h3 float-left w-full">Your decision</legend>
        <div className="clear-both flex flex-wrap gap-3 pt-2">
          {(
            [
              ["continue", "Continue"],
              ["stop", "Not this time"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`choice rounded-lg border px-4 font-semibold ${choice === value ? "border-accent bg-accent-soft" : "border-line-strong bg-surface"}`}
            >
              <input type="radio" name="decision" value={value} checked={choice === value} onChange={() => setChoice(value)} />
              {label}
            </label>
          ))}
        </div>
        {choice === "continue" && (
          <p className="hint mt-2">
            If the applicant also continues, you will add contact person, next step and timeline.
          </p>
        )}
      </fieldset>
      <button type="submit" className={primary} disabled={pending}>
        Submit decision
      </button>
      <ErrorText message={error} />
    </form>
  );
}

const SHARE_FIELDS = [
  ["contactPerson", "Contact person"],
  ["nextStep", "Next step"],
  ["timeline", "Timeline"],
] as const;

export function ShareForm({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [values, setValues] = useState({ contactPerson: "", nextStep: "", timeline: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const status = await shareCompanyDetailsAction(meetingId, values);
      if (!status.ok) setError(status.error);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <p className="text-muted">It is a match. Tell the applicant who to contact and what happens next.</p>
      {SHARE_FIELDS.map(([key, label]) => (
        <div key={key}>
          <label htmlFor={`share-${key}`} className="label">
            {label}
          </label>
          <input
            id={`share-${key}`}
            required
            value={values[key]}
            onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            className={`${input} mt-1`}
          />
        </div>
      ))}
      <button type="submit" className={primary} disabled={pending}>
        Share with applicant
      </button>
      <ErrorText message={error} />
    </form>
  );
}
