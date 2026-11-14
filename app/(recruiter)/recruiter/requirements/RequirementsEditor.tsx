"use client";

import { useState, useTransition } from "react";
import { saveRequirements } from "@/app/actions/requirements";
import { MAX_CORE_REQUIREMENTS, type Requirement } from "@/lib/domain/types";

const TOO_MANY_CORE = `Which ones would you actually hire on? Pick at most ${MAX_CORE_REQUIREMENTS}.`;
const EXTRACT_URL = "/api/ai/extract-requirements";

type Item = { req: Requirement; suggested: boolean };
type Notice = { kind: "error" | "success"; text: string } | null;

const button = "btn";
const primary = "btn btn-primary";
const field = "field";

function companyNumber(companyId: string): string {
  return companyId.replace(/^company-/, "");
}

function nextReqNumber(items: Item[]): number {
  const used = items.map((i) => Number(i.req.id.split("-").pop())).filter(Number.isFinite);
  return Math.max(0, ...used, items.length) + 1;
}

function appendNew(companyId: string, items: Item[], texts: string[], suggested: boolean): Item[] {
  const known = new Set(items.map((i) => i.req.text.trim().toLowerCase()));
  const fresh = texts
    .map((t) => t.trim())
    .filter((t) => t !== "" && !known.has(t.toLowerCase()));
  const start = nextReqNumber(items);
  return [
    ...items,
    ...fresh.map((text, i) => ({
      suggested,
      req: {
        id: `req-${companyNumber(companyId)}-${start + i}`,
        companyId,
        text,
        inPractice: "",
        rank: items.length + i + 1,
        isCore: false,
      },
    })),
  ];
}

function move(items: Item[], from: number, to: number): Item[] {
  if (to < 0 || to >= items.length) return items;
  const next = items.filter((_, i) => i !== from);
  return [...next.slice(0, to), items[from], ...next.slice(to)];
}

export function RequirementsEditor({ companyId, initial }: { companyId: string; initial: Requirement[] }) {
  const [items, setItems] = useState<Item[]>(() => initial.map((req) => ({ req, suggested: false })));
  const [notice, setNotice] = useState<Notice>(null);
  const [pasted, setPasted] = useState("");
  const [newText, setNewText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const coreCount = items.filter((i) => i.req.isCore).length;

  const patch = (index: number, change: Partial<Requirement>, keepSuggested = false) =>
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { suggested: keepSuggested && item.suggested, req: { ...item.req, ...change } } : item,
      ),
    );

  const toggleCore = (index: number, checked: boolean) => {
    if (checked && coreCount >= MAX_CORE_REQUIREMENTS) {
      setNotice({ kind: "error", text: TOO_MANY_CORE });
      return;
    }
    setNotice(null);
    patch(index, { isCore: checked });
  };

  const keep = (index: number) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, suggested: false } : item)));

  const extract = async () => {
    setExtracting(true);
    setAiNote(null);
    try {
      const res = await fetch(EXTRACT_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobAd: pasted }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { value: string[]; source: string };
      const next = appendNew(companyId, items, data.value, true);
      const added = next.length - items.length;
      setItems(next);
      const result =
        added > 0
          ? `Added ${added} suggested requirement${added === 1 ? "" : "s"} at the bottom of the list.`
          : "No new requirements found — they are already in the list.";
      setAiNote(data.source === "mock-fallback" ? `AI unavailable — showing example. ${result}` : result);
      setPasted("");
    } catch {
      setAiNote("AI unavailable");
    } finally {
      setExtracting(false);
    }
  };

  const save = () => {
    if (coreCount === 0) {
      setNotice({ kind: "error", text: "Pick at least one core requirement before saving." });
      return;
    }
    startSaving(async () => {
      const result = await saveRequirements(
        companyId,
        items.map((item, i) => ({ ...item.req, rank: i + 1 })),
      );
      if (!result.ok) return setNotice({ kind: "error", text: result.error });
      setNotice({ kind: "success", text: "Saved." });
      setItems((prev) => prev.map((item) => ({ ...item, suggested: false })));
    });
  };

  return (
    <div className="mt-10 space-y-10">
      <section aria-labelledby="paste-heading" className="panel space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="paste-heading" className="h3">Paste an old job ad</h2>
          <span className="tag tag-ai">Optional AI help</span>
        </div>
        <label htmlFor="job-ad" className="hint block">
          We suggest requirement phrases from it. You decide which to keep.
        </label>
        <textarea
          id="job-ad"
          rows={5}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          className={`${field} py-2`}
        />
        <button type="button" onClick={extract} disabled={extracting || pasted.trim() === ""} className={button}>
          {extracting ? "Reading the ad…" : "Suggest requirements"}
        </button>
        {aiNote && (
          <p role="status" className="hint">
            {aiNote}
          </p>
        )}
      </section>

      <section aria-labelledby="list-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="list-heading" className="h2">
            Requirements, most important first{" "}
            <span className="whitespace-nowrap font-sans text-base font-semibold text-muted">({coreCount} of {MAX_CORE_REQUIREMENTS} core)</span>
          </h2>
          <div aria-hidden="true" className="flex gap-1.5">
            {Array.from({ length: MAX_CORE_REQUIREMENTS }, (_, i) => (
              <span key={i} className={`h-2.5 w-6 rounded-full ${i < coreCount ? "bg-accent" : "border border-line-strong"}`} />
            ))}
          </div>
        </div>
        {items.length === 0 && <p className="empty-slot">No requirements yet. Paste a job ad or add one below.</p>}
        <ol className="space-y-3">
          {items.map((item, index) => {
            const { req } = item;
            return (
              <li
                key={req.id}
                className={`card !p-4 sm:!p-5 ${req.isCore ? "border-accent bg-accent-soft/40" : ""}`}
              >
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <span className="w-6 shrink-0 pt-0.5 font-serif text-muted">{index + 1}</span>
                  <span className="min-w-0 flex-1 font-semibold">{req.text}</span>
                  {item.suggested && <span className="tag tag-ai">AI suggestion</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:pl-9">
                  <label className="choice mr-3 font-semibold">
                    <input
                      type="checkbox"
                      checked={req.isCore}
                      onChange={(e) => toggleCore(index, e.target.checked)}
                    />
                    Core
                  </label>
                  <button type="button" className={button} disabled={index === 0}
                    onClick={() => setItems((p) => move(p, index, index - 1))}
                    aria-label={`Move ${req.text} up`}>
                    Up
                  </button>
                  <button type="button" className={button} disabled={index === items.length - 1}
                    onClick={() => setItems((p) => move(p, index, index + 1))}
                    aria-label={`Move ${req.text} down`}>
                    Down
                  </button>
                  {item.suggested && (
                    <button type="button" className={button} onClick={() => keep(index)}>
                      Keep
                    </button>
                  )}
                </div>
                <div className="mt-3 sm:pl-9">
                  <label className="hint block" htmlFor={`practice-${req.id}`}>
                    In practice: what does this look like on the job?
                  </label>
                  <input
                    id={`practice-${req.id}`}
                    type="text"
                    value={req.inPractice}
                    onChange={(e) => patch(index, { inPractice: e.target.value })}
                    className={`${field} mt-1`}
                  />
                </div>
              </li>
            );
          })}
        </ol>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setItems((prev) => appendNew(companyId, prev, [newText], false));
            setNewText("");
          }}
        >
          <div className="min-w-48 flex-1">
            <label htmlFor="new-req" className="label">Add a requirement</label>
            <input id="new-req" type="text" value={newText} onChange={(e) => setNewText(e.target.value)} className={`${field} mt-1`} />
          </div>
          <button type="submit" className={button} disabled={newText.trim() === ""}>
            Add
          </button>
        </form>
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-canvas px-4 py-4 sm:mx-0 sm:rounded-xl sm:border sm:bg-surface sm:px-5">
        <button type="button" onClick={save} disabled={saving || coreCount === 0} className={primary}>
          {saving ? "Saving…" : "Save requirements"}
        </button>
        {coreCount === 0 && <p className="hint">Pick at least one core requirement to save.</p>}
        <p
          role={notice?.kind === "error" ? "alert" : "status"}
          className={notice?.kind === "error" ? "font-medium text-danger" : "font-medium text-success"}
        >
          {notice?.text}
        </p>
      </div>
    </div>
  );
}
