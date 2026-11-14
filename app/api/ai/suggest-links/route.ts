import { z } from "zod";
import { suggestLinks } from "@/lib/ai/functions";
import { handle } from "@/lib/ai/http";
import { mockSuggestLinks } from "@/lib/ai/mock";
import { findOwnSuggestInput } from "@/lib/ai/suggestInput";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

const Body = z.object({ storyId: z.string().min(1) });

/** Server-side lookup scoped to the session applicant; the client never sends requirements. */
async function load(storyId: string) {
  const [db, session] = await Promise.all([readDb(), getSession()]);
  return findOwnSuggestInput(db, storyId, session.applicantId, session.eventId);
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
