import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { RequirementsEditor } from "./RequirementsEditor";

export default async function RequirementsPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const company = db.companies.find((c) => c.id === session.companyId);

  if (!company) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold">Core requirements</h1>
        <p className="mt-3">Pick a company in the top bar.</p>
      </main>
    );
  }

  const requirements = db.requirements
    .filter((r) => r.companyId === company.id)
    .sort((a, b) => a.rank - b.rank);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">Core requirements for {company.name}</h1>
      <p className="mt-2 text-neutral-800">
        Rank what you ask for, then tick the 1 to 5 you would actually hire on. For each core
        requirement, say in one line what it looks like in practice.
      </p>
      <RequirementsEditor key={company.id} companyId={company.id} initial={requirements} />
    </main>
  );
}
