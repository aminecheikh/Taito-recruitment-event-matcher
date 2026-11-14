"use client";

import { useState, useTransition } from "react";
import { saveRequirements } from "@/app/actions/requirements";
import { MAX_CORE_REQUIREMENTS, type Requirement } from "@/lib/domain/types";

const TOO_MANY_CORE = `Which ones would you actually hire on? Pick at most ${MAX_CORE_REQUIREMENTS}.`;
const EXTRACT_URL = "/api/ai/extract-requirements";

type Item = { req: Requirement; suggested: boolean };
type Notice = { kind: "error" | "success"; text: string } | null;

const button =
  "min-h-11 rounded border border-neutral-700 bg-white px-3 text-sm text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-500 disabled:border-neutral-400";
const primary =
  "min-h-11 rounded bg-neutral-900 px-4 text-sm font-medium text-white disabled:bg-neutral-600";
const field = "min-h-11 w-full rounded border border-neutral-700 bg-white px-3 text-neutral-900";

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
      setItems((prev) => appendNew(companyId, prev, data.value, true));
      setAiNote(data.source === "mock-fallback" ? "AI unavailable — showing example" : null);
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
    <div className="mt-6 space-y-6">
      <section aria-labelledby="paste-heading" className="space-y-2">
        <h2 id="paste-heading" className="text-lg font-semibold">Paste an old job ad</h2>
        <label htmlFor="job-ad" className="block text-sm text-neutral-800">
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
          <p role="status" className="text-sm text-neutral-900">
            {aiNote}
          </p>
        )}
      </section>

      <section aria-labelledby="list-heading" className="space-y-3">
        <h2 id="list-heading" className="text-lg font-semibold">
          Requirements, most important first ({coreCount} of {MAX_CORE_REQUIREMENTS} core)
        </h2>
        {items.length === 0 && <p>No requirements yet. Paste a job ad or add one below.</p>}
        <ol className="space-y-3">
          {items.map((item, index) => {
            const { req } = item;
            return (
              <li key={req.id} className="border border-neutral-400 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {index + 1}. {req.text}
                  </span>
                  {item.suggested && (
                    <span className="border border-neutral-700 px-2 text-sm">AI suggestion</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="flex min-h-11 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={req.isCore}
                      onChange={(e) => toggleCore(index, e.target.checked)}
                      className="h-5 w-5"
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
                <label className="mt-2 block text-sm" htmlFor={`practice-${req.id}`}>
                  In practice: what does this look like on the job?
                </label>
                <input
                  id={`practice-${req.id}`}
                  type="text"
                  value={req.inPractice}
                  onChange={(e) => patch(index, { inPractice: e.target.value })}
                  className={field}
                />
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
            <label htmlFor="new-req" className="block text-sm">Add a requirement</label>
            <input id="new-req" type="text" value={newText} onChange={(e) => setNewText(e.target.value)} className={field} />
          </div>
          <button type="submit" className={button} disabled={newText.trim() === ""}>
            Add
          </button>
        </form>
      </section>

      <div className="space-y-2">
        <button type="button" onClick={save} disabled={saving || coreCount === 0} className={primary}>
          {saving ? "Saving…" : "Save requirements"}
        </button>
        {coreCount === 0 && <p className="text-sm">Pick at least one core requirement to save.</p>}
        <p
          role={notice?.kind === "error" ? "alert" : "status"}
          className={notice?.kind === "error" ? "font-medium text-red-800" : "font-medium text-green-900"}
        >
          {notice?.text}
        </p>
      </div>
    </div>
  );
}
