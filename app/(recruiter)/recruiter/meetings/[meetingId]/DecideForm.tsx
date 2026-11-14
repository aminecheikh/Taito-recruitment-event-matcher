"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideAction, shareCompanyDetailsAction } from "@/app/actions/meetings";

type Req = { id: string; text: string };

const input = "min-h-11 w-full rounded border border-neutral-700 bg-white px-2 text-neutral-900";
const primary = "min-h-11 rounded bg-neutral-900 px-4 text-sm font-medium text-white disabled:bg-neutral-600";

function ErrorText({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="mt-2 text-red-800">
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
    <form onSubmit={submit} className="mt-4 space-y-4">
      <h2 className="text-lg font-semibold">Score the conversation</h2>
      {requirements.map((r) => (
        <div key={r.id}>
          <label htmlFor={`s-${r.id}`} className="block font-medium">
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
              <label htmlFor={`f-${r.id}`} className="mt-2 block text-sm text-neutral-800">
                Feedback line for the applicant on this requirement
              </label>
              <input
                id={`f-${r.id}`}
                required
                value={feedback[r.id] ?? ""}
                onChange={(e) => setFeedback({ ...feedback, [r.id]: e.target.value })}
                className={input}
              />
            </>
          )}
        </div>
      ))}
      <fieldset>
        <legend className="text-lg font-semibold">Your decision</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {(
            [
              ["continue", "Continue"],
              ["stop", "Not this time"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex min-h-11 items-center gap-2">
              <input type="radio" name="decision" value={value} checked={choice === value} onChange={() => setChoice(value)} />
              {label}
            </label>
          ))}
        </div>
        {choice === "continue" && (
          <p className="mt-1 text-sm text-neutral-700">
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
      <p>It is a match. Tell the applicant who to contact and what happens next.</p>
      {SHARE_FIELDS.map(([key, label]) => (
        <div key={key}>
          <label htmlFor={`share-${key}`} className="block font-medium">
            {label}
          </label>
          <input
            id={`share-${key}`}
            required
            value={values[key]}
            onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            className={input}
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
