import { buildCard } from "@/lib/domain/cards";
import { coreRequirements } from "@/lib/domain/requirements";
import type { Db } from "@/lib/domain/types";

export type SearchCard = {
  alias: string;
  examples: { requirementId: string; body: string }[];
};

export type SearchInput = {
  query: string;
  requirements: { id: string; text: string; inPractice: string }[];
  cards: SearchCard[];
  /** alias -> applicant id. Stays on the server; the model only ever sees the alias. */
  aliases: Record<string, string>;
};

/**
 * What the AI search may read: the company's core requirements and, per applicant on the shown list,
 * the examples they linked to them, exactly what the recruiter sees on the card. Applicants get a
 * per-request alias (A1, A2, ...). No scores, names, pseudonyms, ids or contact details are included.
 */
export function buildSearchInput(
  db: Db,
  companyId: string,
  applicantIds: readonly string[],
  query: string,
): SearchInput {
  const requirements = coreRequirements(db, companyId).map(({ id, text, inPractice }) => ({ id, text, inPractice }));
  const entries = applicantIds.map((applicantId, i) => {
    const card = buildCard(db, companyId, applicantId);
    const examples = card.slots.flatMap((slot) =>
      slot.example ? [{ requirementId: slot.requirement.id, body: slot.example.entry.body }] : [],
    );
    return { alias: `A${i + 1}`, applicantId, examples };
  });
  return {
    query,
    requirements,
    cards: entries.map(({ alias, examples }) => ({ alias, examples })),
    aliases: Object.fromEntries(entries.map(({ alias, applicantId }) => [alias, applicantId])),
  };
}
