import { PageHeader } from "@/app/components/PageHeader";
import { ReminderBanner } from "@/app/components/ReminderBanner";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { RequirementsEditor } from "./RequirementsEditor";

export default async function RequirementsPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const company = db.companies.find((c) => c.id === session.companyId);

  if (!company) {
    return (
      <main className="page">
        <PageHeader title="Core requirements">Pick a company in the top bar.</PageHeader>
      </main>
    );
  }

  const requirements = db.requirements
    .filter((r) => r.companyId === company.id)
    .sort((a, b) => a.rank - b.rank);

  return (
    <main className="page">
      <PageHeader eyebrow={company.name} title={<>Core requirements for {company.name}</>}>
        Rank what you ask for, then tick the 1 to 5 you would actually hire on. For each core
        requirement, say in one line what it looks like in practice.
      </PageHeader>
      <ReminderBanner />
      <RequirementsEditor key={company.id} companyId={company.id} initial={requirements} />
    </main>
  );
}
