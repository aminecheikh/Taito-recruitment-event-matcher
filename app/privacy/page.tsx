import { PageHeader } from "@/app/components/PageHeader";
import { PERSONAL_DATA_FIELDS, RETENTION_DAYS } from "@/lib/domain/privacy";
import { getSession } from "@/lib/session";
import { MyDataControls } from "./MyDataControls";

const NEVER_COLLECTED = ["Photo", "Age", "Gender", "Nationality", "Language of origin", "School name"];

export default async function PrivacyPage() {
  const session = await getSession();
  return (
    <main className="page">
      <PageHeader title="Privacy and your data">
        What Taito keeps about an applicant, why, who sees it and when it goes. All data in this demo is synthetic.
      </PageHeader>

      {session.role === "applicant" ? (
        <section className="card mt-8" aria-label="My data">
          <h2 className="h2">My data</h2>
          <p className="hint mt-1">Download everything held about you, or delete it all. Recruiter scores are not part of the download.</p>
          <MyDataControls />
        </section>
      ) : null}

      <h2 className="h2 mt-10">What we keep and why</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-4">Data</th>
              <th scope="col" className="py-2 pr-4">Purpose</th>
              <th scope="col" className="py-2 pr-4">Who sees it</th>
              <th scope="col" className="py-2">Deleted</th>
            </tr>
          </thead>
          <tbody>
            {PERSONAL_DATA_FIELDS.map((f) => (
              <tr key={`${f.collection}.${f.field}`} className="border-b border-line align-top">
                <th scope="row" className="py-2 pr-4 font-medium">{f.collection} / {f.field}</th>
                <td className="py-2 pr-4">{f.purpose}</td>
                <td className="py-2 pr-4">{f.whoSees}</td>
                <td className="py-2">{f.deletedWhen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h2 mt-10">What the AI receives</h2>
      <p className="mt-2">
        Only the text you write and the requirement text it relates to. Never your name or contact details. AI output is marked
        <span className="tag tag-ai ml-1">AI</span> and you decide whether to use it.
      </p>

      <h2 className="h2 mt-10">What we never collect</h2>
      <ul className="mt-2 list-disc pl-6">
        {NEVER_COLLECTED.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <h2 className="h2 mt-10">Retention</h2>
      <p className="mt-2">Applicant data is deleted {RETENTION_DAYS} days after the event, or sooner when you delete it yourself.</p>
    </main>
  );
}
