"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSavedEntry, editSavedEntry, type EntryStatus } from "@/app/actions/entries";
import { buttonClass, fieldClass, primaryClass } from "../stories/ui";

export type EntryView = {
  id: string;
  body: string;
  languageLabel?: string;
  storyTitle?: string;
  usedFor: { requirementId: string; companyId: string; companyName: string; position: number; text: string }[];
};

const DELETE_PROMPT = "Delete this entry? It will be removed from every card that uses it.";

export function EntryItem({ entry }: { entry: EntryView }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const startEdit = () => {
    setText(entry.body);
    setError(null);
    setEditing(true);
  };
  const save = () => settle(() => editSavedEntry(entry.id, text), () => setEditing(false));
  const remove = () => {
    if (!window.confirm(DELETE_PROMPT)) return;
    void settle(() => deleteSavedEntry(entry.id));
  };

  const textId = `${entry.id}-text`;
  const usedId = `${entry.id}-used`;
  return (
    <li className="card" aria-label={`Saved entry ${entry.id}`}>
      {editing ? (
        <div>
          <label htmlFor={textId} className="label">Your entry, in your own words</label>
          <textarea id={textId} className={`${fieldClass} mt-1 min-h-32`} value={text} disabled={busy} onChange={(e) => setText(e.target.value)} />
          {entry.usedFor.length > 1 ? <p className="hint mt-2">Changes apply to every card that uses this entry.</p> : null}
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{entry.body}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {entry.languageLabel ? <span className="tag tag-ai">{entry.languageLabel}</span> : null}
        {entry.storyTitle ? <span className="hint">Started from story: {entry.storyTitle}</span> : null}
      </div>
      <div className="mt-4">
        <h2 id={usedId} className="label">Used for</h2>
        {entry.usedFor.length === 0 ? (
          <p className="hint mt-1">Not used on any card</p>
        ) : (
          <ul aria-labelledby={usedId} className="mt-1 space-y-1">
            {entry.usedFor.map((u) => (
              <li key={u.requirementId}>
                <Link href={`/applicant/companies/${u.companyId}`} className="link">{u.companyName} #{u.position} — {u.text}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button type="button" className={primaryClass} disabled={busy || text.trim() === ""} onClick={save}>Save</button>
            <button type="button" className={buttonClass} disabled={busy} onClick={() => { setEditing(false); setError(null); }}>Cancel</button>
          </>
        ) : (
          <button type="button" className={`${buttonClass} btn-sm`} disabled={busy} onClick={startEdit}>Edit</button>
        )}
        <button type="button" className={`${buttonClass} btn-sm`} disabled={busy} onClick={remove}>Delete</button>
      </div>
      {error ? <p role="alert" className="mt-3 font-medium text-danger">{error}</p> : null}
    </li>
  );
}
