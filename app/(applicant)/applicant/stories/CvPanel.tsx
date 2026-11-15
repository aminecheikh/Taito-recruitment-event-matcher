"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import type { RequirementInfo } from "./NewStorySection";
import { checkPdfFile } from "./pdfText";
import { readPdfText } from "./readPdf";
import { truncateTitle } from "./truncateTitle";
import { FALLBACK_NOTICE, buttonClass, fieldClass, primaryClass } from "./ui";

const CV_URL = "/api/ai/cv-suggestions";
const MIN_CV_CHARS = 50;
const MAX_CV_CHARS = 15000;
const HINT = "Paste your CV, LinkedIn About text or your own posts. Remove your name and contact details first. It is not saved.";
const PDF_HINT = "Your PDF is read on this device and never uploaded. Its text appears below so you can check it first.";

const ResponseSchema = z.object({
  value: z.object({
    storyStarts: z.array(z.object({ excerpt: z.string(), question: z.string() })),
    relevant: z.array(z.object({ requirementId: z.string(), excerpt: z.string() })),
  }),
  source: z.enum(["model", "mock", "mock-fallback"]),
});
type Result = z.infer<typeof ResponseSchema>;

type Props = { requirementInfo: Record<string, RequirementInfo>; onStart: (title: string) => void };

/** The pasted text lives only in this component's state and the request; nothing is saved. */
export function CvPanel({ requirementInfo, onStart }: Props) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfNote, setPdfNote] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const tooShort = text.trim().length < MIN_CV_CHARS;

  const readFile = async (file: File) => {
    setError(null);
    setPdfNote(null);
    const problem = checkPdfFile(file);
    if (problem) return setError(problem);
    setPdfBusy(true);
    try {
      const extracted = await readPdfText(file);
      if (extracted.length < MIN_CV_CHARS) {
        setError("This PDF has no readable text (it may be a scan). Paste your text instead.");
        return;
      }
      setText(extracted.slice(0, MAX_CV_CHARS));
      setResult(null);
      setPdfNote(`Text taken from ${file.name}. Check it below and remove your name and contact details before you continue.`);
    } catch {
      setError("Could not read this PDF. Paste your text instead.");
    } finally {
      setPdfBusy(false);
    }
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void readFile(file);
  };

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (pdfBusy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(CV_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cvText: text.trim() }),
      });
      if (!res.ok) throw new Error("bad status");
      setResult(ResponseSchema.parse(await res.json()));
    } catch {
      setError("Could not read your text right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const relevant = (result?.value.relevant ?? []).filter((r) => requirementInfo[r.requirementId]);

  return (
    <details className="ai-panel mt-8">
      <summary className="cursor-pointer font-semibold">
        <span className="tag tag-ai mr-2">AI</span>Start from your CV
      </summary>
      <div className="mt-4">
        <p className="label">Upload a PDF</p>
        <p className="hint mt-1">{PDF_HINT}</p>
        <label
          htmlFor="cv-file"
          className="drop-zone mt-2"
          data-dragging={dragging || undefined}
          aria-busy={pdfBusy || undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input id="cv-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={onPick} disabled={pdfBusy} />
          <span className="drop-zone-text">{pdfBusy ? "Reading the PDF…" : "Drag and drop your CV as a PDF here, or"}</span>
          <span className={`${buttonClass} btn-sm pointer-events-none`}>Choose a file</span>
        </label>
        {pdfNote ? <p role="status" className="mt-2 font-medium">{pdfNote}</p> : null}
        <label htmlFor="cv-text" className="label mt-5">Or paste your text</label>
        <p className="hint mt-1">{HINT}</p>
        <textarea id="cv-text" className={`${fieldClass} mt-2`} rows={8} maxLength={MAX_CV_CHARS} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className={primaryClass} onClick={run} disabled={loading || tooShort}>
            {loading ? "Reading…" : "Find story ideas"}
          </button>
          {tooShort ? <span className="hint">At least {MIN_CV_CHARS} characters.</span> : null}
        </div>
        {error ? <p role="alert" className="mt-3 font-medium text-danger">{error}</p> : null}
        {result ? (
          <div className="mt-5 space-y-6" aria-live="polite">
            {result.source === "mock-fallback" ? <p className="hint">{FALLBACK_NOTICE}</p> : null}
            <section aria-label="Could make a good story">
              <h3 className="label">Could make a good story</h3>
              {result.value.storyStarts.length === 0 ? <p className="hint mt-2">Nothing stood out. Add a story in your own words below.</p> : null}
              <ul className="mt-2 space-y-3">
                {result.value.storyStarts.map((s) => (
                  <li key={s.excerpt} className="card">
                    <p className="font-serif">&ldquo;{s.excerpt}&rdquo;</p>
                    <p className="mt-1 text-muted">{s.question}</p>
                    <button type="button" className={`${buttonClass} btn-sm mt-3`} onClick={() => onStart(truncateTitle(s.excerpt))}>Start this story</button>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="Requirements at this event your CV touches on">
              <h3 className="label">Requirements at this event your CV touches on</h3>
              {relevant.length === 0 ? <p className="hint mt-2">No core requirement at this event matched your text.</p> : null}
              <ul className="mt-2 space-y-2">
                {relevant.map((r) => {
                  const info = requirementInfo[r.requirementId];
                  return (
                    <li key={`${r.requirementId}:${r.excerpt}`}>
                      <Link href={`/applicant/companies/${info.companyId}`} className="underline">
                        {info.companyName} · {info.text}
                      </Link>
                      <span className="text-muted"> · &ldquo;{r.excerpt}&rdquo;</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        ) : null}
      </div>
    </details>
  );
}
