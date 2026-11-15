"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { createStory, saveStory } from "@/app/actions/stories";
import type { LanguageLabel, Story } from "@/lib/domain/types";
import { FollowUpPanel } from "./FollowUpPanel";
import { LanguagePanel } from "./LanguagePanel";
import { buttonClass, fieldClass, primaryClass } from "./ui";

const BANNER_TEXT = "You're talking to an AI. It only asks questions and fixes language when you ask.";
const BANNER_SEEN_KEY = "ai-banner-seen";

type Notice = { kind: "error" | "success"; text: string } | null;

const BANNER_EVENT = "ai-banner-change";

function subscribeBanner(onChange: () => void) {
  window.addEventListener(BANNER_EVENT, onChange);
  return () => window.removeEventListener(BANNER_EVENT, onChange);
}

function bannerSeen(): boolean {
  try {
    return window.localStorage.getItem(BANNER_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function AiBanner() {
  const seen = useSyncExternalStore(subscribeBanner, bannerSeen, () => true);
  if (seen) return null;
  const dismiss = () => {
    try {
      window.localStorage.setItem(BANNER_SEEN_KEY, "1");
    } catch {
      // storage unavailable: the banner returns next visit
    }
    window.dispatchEvent(new Event(BANNER_EVENT));
  };
  return (
    <div role="note" className="ai-panel mt-6 flex flex-wrap items-center gap-3">
      <span className="tag tag-ai">AI</span>
      <p className="min-w-0 flex-1">{BANNER_TEXT}</p>
      <button type="button" onClick={dismiss} className={buttonClass}>Got it</button>
    </div>
  );
}

export function StoryEditor({ story, initialTitle = "" }: { story: Story | null; initialTitle?: string }) {
  const [title, setTitle] = useState(story?.title ?? initialTitle);
  const [body, setBody] = useState(story?.body ?? "");
  const [label, setLabel] = useState<LanguageLabel | undefined>(story?.languageLabel);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();

  const report = (status: { ok: boolean; error?: string }, success: string) =>
    setNotice(status.ok ? { kind: "success", text: success } : { kind: "error", text: status.error ?? "Could not save." });

  const save = () =>
    startTransition(async () => {
      if (story) report(await saveStory(story.id, { title, body }), "Saved.");
      else {
        const status = await createStory({ title, body });
        report(status, "Story added.");
        if (status.ok) {
          setTitle("");
          setBody("");
        }
      }
    });

  const acceptLanguage = (text: string, nextLabel: LanguageLabel) => {
    if (!story) return;
    startTransition(async () => {
      const status = await saveStory(story.id, { body: text, languageLabel: nextLabel });
      report(status, "Saved the new version.");
      if (status.ok) {
        setBody(text);
        setLabel(nextLabel);
      }
    });
  };

  const appendAnswer = (answer: string) => setBody((current) => `${current.trimEnd()}\n\n${answer.trim()}`);
  const idPrefix = story?.id ?? "new";

  const editor = (
    <div className="min-w-0">
      <label htmlFor={`${idPrefix}-title`} className="label">Title</label>
      <input id={`${idPrefix}-title`} className={`${fieldClass} mt-1 font-serif text-lg font-semibold`} value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor={`${idPrefix}-body`} className="label mt-4">Your story</label>
      <textarea id={`${idPrefix}-body`} className={`${fieldClass} mt-1 leading-relaxed`} rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
      {label ? <p className="mt-2"><span className="tag tag-ai">{label}</span></p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className={primaryClass} onClick={save} disabled={pending}>
          {story ? "Save story" : "Add story"}
        </button>
        {notice ? (
          <p role={notice.kind === "error" ? "alert" : "status"} className={notice.kind === "error" ? "font-medium text-danger" : "font-medium text-success"}>
            {notice.text}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (!story) {
    return <section className="card" aria-label="New story">{editor}</section>;
  }

  return (
    <section className="card grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]" aria-label={`Story: ${story.title}`}>
      {editor}
      <aside aria-label="AI help for this story" className="grid content-start gap-3 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <p><span className="tag tag-ai">Optional AI help</span></p>
        <FollowUpPanel idPrefix={idPrefix} storyBody={body} onAddAnswer={appendAnswer} />
        <LanguagePanel idPrefix={idPrefix} text={body} onAccept={acceptLanguage} disabled={pending} />
      </aside>
    </section>
  );
}
