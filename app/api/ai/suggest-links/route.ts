import { z } from "zod";
import { suggestLinks } from "@/lib/ai/functions";
import { handle } from "@/lib/ai/http";
import { mockSuggestLinks } from "@/lib/ai/mock";
import { coreRequirements } from "@/lib/domain/requirements";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

const Body = z.object({ storyId: z.string().min(1) });

/** Loads the story and every core requirement of companies at the session event; server-side only. */
async function load(storyId: string) {
  const [db, session] = await Promise.all([readDb(), getSession()]);
  const story = db.stories.find((s) => s.id === storyId);
  if (!story) return null;
  const companyIds = db.companyEvents
    .filter((ce) => ce.eventId === session.eventId)
    .map((ce) => ce.companyId);
  const requirements = companyIds.flatMap((id) => coreRequirements(db, id));
  return { story: { id: story.id, body: story.body }, requirements };
}

export const POST = handle(
  Body,
  async ({ storyId }) => {
    const input = await load(storyId);
    return input ? suggestLinks(input) : null;
  },
  async ({ storyId }) => {
    const input = await load(storyId);
    return input ? mockSuggestLinks(input.story.body, input.requirements) : null;
  },
);
