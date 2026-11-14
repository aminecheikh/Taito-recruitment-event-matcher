import { PageHeader } from "@/app/components/PageHeader";
import { coreRequirements } from "@/lib/domain/requirements";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { EntryItem, type EntryView } from "./EntryItem";

const idNumber = (id: string): number => Number(id.match(/(\d+)$/)?.[1] ?? Number.MAX_SAFE_INTEGER);

export default async function EntriesPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);

  if (!applicant) {
    return (
      <main className="page">
        <PageHeader title="Saved entries">Pick an applicant in the top bar</PageHeader>
      </main>
    );
  }

  const companyName = new Map(db.companies.map((c) => [c.id, c.name]));
  const stories = new Map(db.stories.filter((s) => s.applicantId === applicant.id).map((s) => [s.id, s.title]));

  const usedFor = (entryId: string): EntryView["usedFor"] => {
    const answered = new Set(db.answers.filter((a) => a.applicantId === applicant.id && a.entryId === entryId).map((a) => a.requirementId));
    return db.requirements.flatMap((req) => {
      if (!answered.has(req.id)) return [];
      const position = coreRequirements(db, req.companyId).findIndex((r) => r.id === req.id) + 1;
      return [{ requirementId: req.id, companyId: req.companyId, companyName: companyName.get(req.companyId) ?? req.companyId, position, text: req.text }];
    });
  };

  const entries: EntryView[] = db.entries
    .filter((e) => e.applicantId === applicant.id)
    .sort((a, b) => idNumber(a.id) - idNumber(b.id) || a.id.localeCompare(b.id))
    .map((e) => ({
      id: e.id,
      body: e.body,
      languageLabel: e.languageLabel,
      storyTitle: e.sourceStoryId ? stories.get(e.sourceStoryId) : undefined,
      usedFor: usedFor(e.id),
    }));

  return (
    <main className="page">
      <PageHeader eyebrow={applicant.pseudonym} title="Saved entries">
        Everything you wrote on requirement cards. Reuse an entry on any card that asks for the same thing.
      </PageHeader>
      {entries.length === 0 ? (
        <p className="mt-8 text-muted">Nothing saved yet. Fill in a requirement card on a company page.</p>
      ) : (
        <ul className="mt-8 space-y-5">
          {entries.map((entry) => (
            <EntryItem key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </main>
  );
}
