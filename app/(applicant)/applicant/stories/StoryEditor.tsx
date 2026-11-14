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
    <div role="note" className="mt-4 flex flex-wrap items-center gap-3 rounded border border-neutral-700 bg-neutral-100 p-3 text-neutral-900">
      <p className="flex-1">{BANNER_TEXT}</p>
      <button type="button" onClick={dismiss} className={buttonClass}>Got it</button>
    </div>
  );
}

export function StoryEditor({ story }: { story: Story | null }) {
  const [title, setTitle] = useState(story?.title ?? "");
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

  return (
    <section className="rounded border border-neutral-400 p-4" aria-label={story ? `Story: ${story.title}` : "New story"}>
      <label htmlFor={`${idPrefix}-title`} className="block text-sm font-medium">Title</label>
      <input id={`${idPrefix}-title`} className={`${fieldClass} min-h-11`} value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor={`${idPrefix}-body`} className="mt-3 block text-sm font-medium">Your story</label>
      <textarea id={`${idPrefix}-body`} className={fieldClass} rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
      {label ? <p className="mt-1 text-sm text-neutral-800">Label: {label}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className={primaryClass} onClick={save} disabled={pending}>
          {story ? "Save story" : "Add story"}
        </button>
        {notice ? (
          <p role={notice.kind === "error" ? "alert" : "status"} className={notice.kind === "error" ? "text-red-800" : "text-green-900"}>
            {notice.text}
          </p>
        ) : null}
      </div>
      {story ? (
        <div className="mt-4 grid gap-4">
          <FollowUpPanel idPrefix={idPrefix} storyBody={body} onAddAnswer={appendAnswer} />
          <LanguagePanel idPrefix={idPrefix} text={body} onAccept={acceptLanguage} disabled={pending} />
        </div>
      ) : null}
    </section>
  );
}
