import { enterRole } from "@/app/actions/session";

const ENTRIES = [
  { role: "recruiter", label: "I'm a recruiter" },
  { role: "applicant", label: "I'm an applicant" },
  { role: "staff", label: "I'm event staff" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-semibold">No CV, No Job Ad</h1>
      <p className="mt-4 text-lg">
        Recruiters name the few things they hire on. Applicants show real examples in their own
        words. The AI only asks and suggests; people decide.
      </p>
      <form action={enterRole} className="mt-6 flex flex-col gap-3 sm:flex-row">
        {ENTRIES.map((entry) => (
          <button
            key={entry.role}
            type="submit"
            name="role"
            value={entry.role}
            className="min-h-11 rounded border border-neutral-900 bg-neutral-900 px-4 text-base font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            {entry.label}
          </button>
        ))}
      </form>
      <p className="mt-6 text-sm text-neutral-700">Prototype — all people and companies are fictional.</p>
    </main>
  );
}
