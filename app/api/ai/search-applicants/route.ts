import { z } from "zod";
import { NO_SEARCH_RESULT, searchApplicants } from "@/lib/ai/functions";
import { handle } from "@/lib/ai/http";
import { buildSearchInput } from "@/lib/ai/searchInput";
import { recruiterList } from "@/lib/domain/applicantList";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

const MAX_QUERY_LENGTH = 500;

// The client sends only the question and the list filters; cards are loaded here for the session's company.
const Body = z.object({
  query: z.string().trim().min(1).max(MAX_QUERY_LENGTH),
  minCovered: z.number().int().min(0).default(0),
  markedOnly: z.boolean().default(false),
});

export const POST = handle(
  Body,
  async ({ query, minCovered, markedOnly }) => {
    const [db, session] = await Promise.all([readDb(), getSession()]);
    if (session.role !== "recruiter" || !db.companies.some((c) => c.id === session.companyId)) return null;
    const shown = recruiterList(db, session.eventId, session.companyId, { minCovered, markedOnly });
    return searchApplicants(buildSearchInput(db, session.companyId, shown, query));
  },
  () => NO_SEARCH_RESULT,
);
