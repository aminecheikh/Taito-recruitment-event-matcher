import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { AiBanner, StoryEditor } from "./StoryEditor";

export default async function StoriesPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);

  if (!applicant) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold">My stories</h1>
        <p className="mt-3">Pick an applicant in the top bar</p>
      </main>
    );
  }

  const stories = db.stories.filter((s) => s.applicantId === applicant.id);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">My stories</h1>
      <p className="mt-2 text-neutral-800">
        Tell what you have done in your own words. The words stay yours; the AI never writes your story.
      </p>
      <AiBanner />
      <ul className="mt-4 space-y-6">
        {stories.map((story) => (
          <li key={story.id}>
            <StoryEditor key={story.id} story={story} />
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Add a story</h2>
      <StoryEditor key={`new:${stories.length}`} story={null} />
    </main>
  );
}
