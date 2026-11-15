import { PageHeader } from "@/app/components/PageHeader";
import { coreIdsAtEvent } from "@/lib/domain/attendance";
import { resetEnabled } from "@/lib/demoReset";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { NewStorySection, type RequirementInfo } from "./NewStorySection";
import { AiBanner, StoryEditor } from "./StoryEditor";

export default async function StoriesPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);

  if (!applicant) {
    return (
      <main className="page">
        <PageHeader title="My stories">Pick an applicant in the top bar</PageHeader>
      </main>
    );
  }

  const stories = db.stories.filter((s) => s.applicantId === applicant.id);
  const coreIds = coreIdsAtEvent(db, session.eventId);
  const requirementInfo: Record<string, RequirementInfo> = Object.fromEntries(
    db.requirements
      .filter((r) => coreIds.has(r.id))
      .map((r) => [
        r.id,
        { companyId: r.companyId, companyName: db.companies.find((c) => c.id === r.companyId)?.name ?? r.companyId, text: r.text },
      ]),
  );

  return (
    <main className="page page-wide">
      <PageHeader eyebrow={applicant.pseudonym} title="My stories">
        Tell what you have done in your own words. The words stay yours; the AI never writes your story.
      </PageHeader>
      <AiBanner />
      <NewStorySection storyCount={stories.length} requirementInfo={requirementInfo} />
      <h2 className="h2 mt-12">Your stories ({stories.length})</h2>
      {stories.length === 0 ? (
        <p className="empty-slot mt-4">No stories yet. Add one above.</p>
      ) : (
        <>
          <p className="hint mt-1">Open a story to edit it or get AI help.</p>
          <ul className="mt-4 space-y-3">
            {stories.map((story) => (
              <li key={story.id}>
                <StoryEditor key={story.id} story={story} deleteEnabled={resetEnabled()} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
