"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestMeetingAction, scoreAction } from "@/app/actions/recruiter";
import type { Card } from "@/lib/domain/cards";
import { EvidenceCard } from "./EvidenceCard";

const MAX_PER_REQUIREMENT = 10;
const button =
  "min-h-11 rounded border border-neutral-700 bg-white px-3 text-sm text-neutral-900 disabled:cursor-not-allowed disabled:border-neutral-400 disabled:text-neutral-600";

export function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className={button} disabled={pending} onClick={() => start(() => router.refresh())}>
      Refresh
    </button>
  );
}

type Props = { card: Card; initialScores: Record<string, number>; meetingRequested: boolean; slotsLeft: number };

/** Evidence card with score inputs, a total once every core requirement is scored, and the meeting request. */
export function ScoredCard({ card, initialScores, meetingRequested, slotsLeft }: Props) {
  const router = useRouter();
  const [scores, setScores] = useState(initialScores);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onScore = (requirementId: string, value: number) => {
    const previous = scores;
    setScores({ ...scores, [requirementId]: value });
    setError(null);
    start(async () => {
      const status = await scoreAction(card.applicantId, requirementId, value, "card");
      if (!status.ok) {
        setScores(previous);
        setError(status.error);
      }
    });
  };

  const request = () =>
    start(async () => {
      const status = await requestMeetingAction(card.applicantId);
      if (!status.ok) setError(status.error);
      router.refresh();
    });

  const allScored = card.slots.length > 0 && card.slots.every((s) => scores[s.requirement.id] !== undefined);
  const total = card.slots.reduce((sum, s) => sum + (scores[s.requirement.id] ?? 0), 0);

  return (
    <div>
      <EvidenceCard card={card} scores={scores} onScore={onScore} />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {allScored && (
          <p className="font-medium">
            Total {total} / {MAX_PER_REQUIREMENT * card.slots.length}
          </p>
        )}
        <button
          type="button"
          className="min-h-11 rounded bg-neutral-900 px-4 text-sm font-medium text-white disabled:bg-neutral-600"
          disabled={pending || meetingRequested || slotsLeft <= 0}
          onClick={request}
        >
          {meetingRequested ? "Meeting requested" : "Request meeting"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
