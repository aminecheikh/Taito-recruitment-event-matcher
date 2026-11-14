import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { companiesAt } from "@/lib/domain/attendance";
import { entryMatches } from "@/lib/domain/entries";
import { coreRequirements } from "@/lib/domain/requirements";
import type { Db, Requirement } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import type { CardView, StoryView, UsedFor } from "../ui";
import { RequirementCard } from "./RequirementCard";
import { SuggestStoriesButton } from "./SuggestStoriesButton";

function usedForEntry(db: Db, entryId: string, exceptRequirementId: string): UsedFor[] {
  return db.answers
    .filter((a) => a.entryId === entryId && a.requirementId !== exceptRequirementId)
    .flatMap((a) => {
      const req = db.requirements.find((r) => r.id === a.requirementId);
      if (!req) return [];
      const companyName = db.companies.find((c) => c.id === req.companyId)?.name ?? "";
      const index = coreRequirements(db, req.companyId).findIndex((r) => r.id === req.id);
      return [{ companyName, position: index === -1 ? null : index + 1, text: req.text }];
    });
}

function buildCardView(db: Db, applicantId: string, req: Requirement, position: number): CardView {
  const answer = db.answers.find((a) => a.applicantId === applicantId && a.requirementId === req.id);
  const entry = answer && db.entries.find((e) => e.id === answer.entryId && e.applicantId === applicantId);
  const stories = new Map(db.stories.filter((s) => s.applicantId === applicantId).map((s) => [s.id, s]));
  return {
    requirementId: req.id,
    position,
    text: req.text,
    inPractice: req.inPractice,
    answer: entry ? { entryId: entry.id, body: entry.body, languageLabel: entry.languageLabel, alsoUsedFor: usedForEntry(db, entry.id, req.id) } : null,
    matches: entryMatches(db, applicantId, req.id).map((m) => ({
      entryId: m.entry.id,
      body: m.entry.body,
      kind: m.kind,
      sharedWords: m.sharedWords,
      usedFor: m.usedFor.map((u) => {
        const index = coreRequirements(db, db.requirements.find((r) => r.id === u.requirementId)?.companyId ?? "").findIndex((r) => r.id === u.requirementId);
        return { companyName: u.companyName, position: index === -1 ? null : index + 1, text: u.text };
      }),
    })),
    recommendations: db.links
      .filter((l) => l.status === "pending" && l.requirementId === req.id && stories.has(l.storyId))
      .map((l) => {
        const s = stories.get(l.storyId)!;
        return { linkId: l.id, story: { id: s.id, title: s.title, body: s.body }, reason: l.aiReason ?? "" };
      }),
  };
}

export default async function CompanyCardsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const [session, db, { companyId }] = await Promise.all([getSession(), readDb(), params]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);
  if (!applicant) {
    return <main className="page"><PageHeader title="Requirement cards">Pick an applicant in the top bar</PageHeader></main>;
  }
  const company = db.companies.find((c) => c.id === companyId);
  if (!company || !companiesAt(db, session.eventId).includes(company.id)) notFound();

  const stories: StoryView[] = db.stories
    .filter((s) => s.applicantId === applicant.id)
    .map((s) => ({ id: s.id, title: s.title, body: s.body }));
  const cards = coreRequirements(db, company.id).map((r, i) => buildCardView(db, applicant.id, r, i + 1));

  return (
    <main className="page">
      <p><Link href="/applicant/companies" className="link">← Back to companies</Link></p>
      <PageHeader eyebrow={applicant.pseudonym} title={company.name}>
        Fill in one card per requirement, in your own words. Start from a story or reuse something you already wrote.
      </PageHeader>
      <SuggestStoriesButton stories={stories.map((s) => ({ id: s.id }))} />
      <ol className="mt-8 space-y-5">
        {cards.map((card) => <RequirementCard key={card.requirementId} card={card} stories={stories} />)}
      </ol>
    </main>
  );
}
