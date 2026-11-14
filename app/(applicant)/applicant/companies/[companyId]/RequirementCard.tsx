"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { editSavedEntry, removeAnswer, reuseSavedEntry, saveAnswer, type EntryStatus } from "@/app/actions/entries";
import { rejectSuggestion } from "@/app/actions/links";
import { buttonClass, fieldClass, primaryClass } from "../../stories/ui";
import { usedForLabel, type CardView, type StoryView } from "../ui";
import { ReuseEntries } from "./ReuseEntries";
import { StoryStart } from "./StoryStart";

type Mode = "view" | "edit-existing" | "new";

const REPLACE_PROMPT = "Replace what you have written with this story?";
const REPLACE_ENTRY_PROMPT = "Replace what you have written with this saved entry?";

function AnsweredView({ card, busy, onEdit, onRemove }: { card: CardView; busy: boolean; onEdit: () => void; onRemove: () => void }) {
  const answer = card.answer!;
  return (
    <div className="mt-4">
      <p className="whitespace-pre-wrap">{answer.body}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {answer.languageLabel ? <span className="tag tag-ai">{answer.languageLabel}</span> : null}
        {answer.alsoUsedFor.length > 0 ? <span className="hint">Also used for: {answer.alsoUsedFor.map(usedForLabel).join(", ")}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={`${buttonClass} btn-sm`} disabled={busy} onClick={onEdit}>Edit</button>
        <button type="button" className={`${buttonClass} btn-sm`} disabled={busy} onClick={onRemove}>Remove from this card</button>
      </div>
    </div>
  );
}

/** One card per core requirement; the applicant writes in their own words, helpers only fill the box on request. */
export function RequirementCard({ card, stories }: { card: CardView; stories: StoryView[] }) {
  const router = useRouter();
  const answered = card.answer !== null;
  const [mode, setMode] = useState<Mode>("view");
  const [text, setText] = useState("");
  const [sourceStoryId, setSourceStoryId] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showForm = !answered || mode !== "view";
  const existing = card.answer;
  const editingExisting = mode === "edit-existing" && existing !== null;
  const sharedElsewhere = (existing?.alsoUsedFor.length ?? 0) > 0;

  const settle = async (fn: () => Promise<EntryStatus>, after?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else {
        after?.();
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    setMode("view");
    setText("");
    setSourceStoryId(undefined);
    setError(null);
  };
  const startEdit = () => {
    setText(existing?.body ?? "");
    setSourceStoryId(undefined);
    setError(null);
    setMode("edit-existing");
  };
  const startFromStory = (story: StoryView) => {
    if (text.trim() !== "" && text !== story.body && !window.confirm(REPLACE_PROMPT)) return;
    setText(story.body);
    setSourceStoryId(story.id);
    setError(null);
    setMode("new");
  };
  const saveNew = () => settle(() => saveAnswer(card.requirementId, text, sourceStoryId), finish);
  const saveOnlyHere = () => settle(() => saveAnswer(card.requirementId, text, undefined, existing?.entryId), finish);
  const reuse = (entryId: string) => {
    const typed = text.trim() !== "" && text !== (existing?.body ?? "");
    if (typed && !window.confirm(REPLACE_ENTRY_PROMPT)) return;
    void settle(() => reuseSavedEntry(card.requirementId, entryId), finish);
  };
  const saveEverywhere = () => (existing ? settle(() => editSavedEntry(existing.entryId, text), finish) : undefined);
  const dismiss = (linkId: string) => settle(async () => {
    const res = await rejectSuggestion(linkId);
    return res.ok ? { ok: true } : res;
  });

  const id = `card-${card.requirementId}`;
  return (
    <li className="card" aria-labelledby={`${id}-title`}>
      <div className="flex gap-4">
        <span className="req-no req-no-core" aria-label={`Core requirement ${card.position}`}>{card.position}</span>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="font-semibold">{card.text}</h2>
          <p className="hint mt-0.5">In practice: {card.inPractice}</p>
        </div>
      </div>
      {answered && mode === "view" ? (
        <AnsweredView card={card} busy={busy} onEdit={startEdit} onRemove={() => { setError(null); void settle(() => removeAnswer(card.requirementId)); }} />
      ) : null}
      {showForm ? (
        <div className="mt-4">
          <label htmlFor={`${id}-text`} className="label">Your example for this requirement, in your own words</label>
          <textarea id={`${id}-text`} className={`${fieldClass} mt-1 min-h-32`} value={text} disabled={busy} onChange={(e) => setText(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2">
            {editingExisting && sharedElsewhere ? (
              <>
                <button type="button" className={primaryClass} disabled={busy || text.trim() === ""} onClick={saveEverywhere}>Save everywhere it&apos;s used</button>
                <button type="button" className={buttonClass} disabled={busy || text.trim() === ""} onClick={saveOnlyHere}>Save only for this card</button>
              </>
            ) : editingExisting ? (
              <button type="button" className={primaryClass} disabled={busy || text.trim() === ""} onClick={saveEverywhere}>Save</button>
            ) : (
              <button type="button" className={primaryClass} disabled={busy || text.trim() === ""} onClick={saveNew}>Save</button>
            )}
            {answered ? <button type="button" className={buttonClass} disabled={busy} onClick={finish}>Cancel</button> : null}
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-3 font-medium text-danger">{error}</p> : null}
      <ReuseEntries matches={card.matches} busy={busy} onUse={reuse} />
      <StoryStart idPrefix={id} recommendations={card.recommendations} stories={stories} busy={busy} onStart={startFromStory} onDismiss={dismiss} />
    </li>
  );
}
