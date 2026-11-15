import { z } from "zod";
import { suggestFilters } from "@/lib/ai/functions";
import { handle } from "@/lib/ai/http";
import { buildSearchInput } from "@/lib/ai/searchInput";
import { suggestionCache, suggestionKey } from "@/lib/ai/suggestionCache";
import { recruiterList } from "@/lib/domain/applicantList";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

// Built from the job's whole current list (not the coverage or marked view), so one set serves every view.
const WHOLE_LIST = { minCovered: 0, markedOnly: false };

const Body = z.object({ refresh: z.boolean().default(false) });

export const POST = handle(
  Body,
  async ({ refresh }) => {
    const [db, session] = await Promise.all([readDb(), getSession()]);
    if (session.role !== "recruiter" || !db.companies.some((c) => c.id === session.companyId)) return null;
    return suggestionCache.get(
      suggestionKey(session.eventId, session.companyId),
      () => suggestFilters(buildSearchInput(db, session.companyId, recruiterList(db, session.eventId, session.companyId, WHOLE_LIST), "")),
      refresh,
    );
  },
  () => [],
);
