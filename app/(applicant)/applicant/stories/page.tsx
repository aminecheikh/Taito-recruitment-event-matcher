import { PageHeader } from "@/app/components/PageHeader";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
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

  return (
    <main className="page page-wide">
      <PageHeader eyebrow={applicant.pseudonym} title="My stories">
        Tell what you have done in your own words. The words stay yours; the AI never writes your story.
      </PageHeader>
      <AiBanner />
      <ul className="mt-8 space-y-8">
        {stories.map((story) => (
          <li key={story.id}>
            <StoryEditor key={story.id} story={story} />
          </li>
        ))}
      </ul>
      <h2 className="h2 mt-12">Add a story</h2>
      <p className="hint mt-1">A few sentences about something you did: what happened, what you did yourself, what changed.</p>
      <div className="mt-4">
        <StoryEditor key={`new:${stories.length}`} story={null} />
      </div>
    </main>
  );
}
