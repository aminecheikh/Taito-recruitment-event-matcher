"use client";

import { useRef, useState } from "react";
import { CvPanel } from "./CvPanel";
import { StoryEditor } from "./StoryEditor";

export type RequirementInfo = { companyId: string; companyName: string; text: string };

/** Holds the new-story form and the CV panel together so "Start this story" can prefill the title. */
export function NewStorySection({ storyCount, requirementInfo }: { storyCount: number; requirementInfo: Record<string, RequirementInfo> }) {
  const [prefill, setPrefill] = useState({ title: "", nonce: 0 });
  const formRef = useRef<HTMLDivElement>(null);

  const start = (title: string) => {
    setPrefill((current) => ({ title, nonce: current.nonce + 1 }));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <CvPanel requirementInfo={requirementInfo} onStart={start} />
      <h2 className="h2 mt-12">Add a story</h2>
      <p className="hint mt-1">A few sentences about something you did: what happened, what you did yourself, what changed.</p>
      <div className="mt-4" ref={formRef}>
        <StoryEditor key={`new:${storyCount}:${prefill.nonce}`} story={null} initialTitle={prefill.title} />
      </div>
    </>
  );
}
