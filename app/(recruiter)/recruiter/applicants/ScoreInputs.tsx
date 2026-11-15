"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestMeetingAction, scoreAction } from "@/app/actions/recruiter";
import type { Card } from "@/lib/domain/cards";
import { weightedFromValues } from "@/lib/domain/scores";
import { EvidenceCard } from "./EvidenceCard";

const button = "btn";

export function RefreshButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className={button} disabled={pending} onClick={() => start(() => router.refresh())}>
      Refresh
    </button>
  );
}

type Props = { card: Card; initialScores: Record<string, number>; meetingRequested: boolean; slotsLeft: number; coverageText?: string };

/** Evidence card with score inputs, a total once every core requirement is scored, and the meeting request. */
export function ScoredCard({ card, initialScores, meetingRequested, slotsLeft, coverageText }: Props) {
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

  // Slots are in the recruiter's core order, so this matches the table's weighted score.
  const weighted = weightedFromValues(card.slots.map((s) => scores[s.requirement.id]));

  return (
    <div>
      <EvidenceCard
        card={card}
        scores={scores}
        onScore={onScore}
        meta={coverageText ? <span className="tag">{coverageText}</span> : undefined}
        footer={
          <>
            {weighted !== undefined && (
              <p className="mr-auto font-medium">Your weighted score {weighted} / 100</p>
            )}
            <button
              type="button"
              className={meetingRequested ? "btn" : "btn btn-primary"}
              disabled={pending || meetingRequested || slotsLeft <= 0}
              onClick={request}
            >
              {meetingRequested ? "Meeting requested" : "Request meeting"}
            </button>
          </>
        }
      />
      {slotsLeft <= 0 && !meetingRequested ? (
        <p className="mt-2 text-muted">No open slots left for this event (booked or requested).</p>
      ) : null}
      {error && (
        <p role="alert" className="notice notice-error mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
