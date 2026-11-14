import { signalCompanyForm } from "@/app/actions/signals";
import { coverage } from "@/lib/domain/cards";
import { signalsLeft } from "@/lib/domain/signals";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

const ERROR_MESSAGES: Record<string, string> = {
  "no-signals-left": "You've used all your signals for this event.",
  "already-signalled": "You already signalled this company.",
  "no-accepted-example": "Add at least one example first.",
  "not-found": "Something went wrong — refresh and try again.",
};

function ruleText(name: string, total: number): string {
  if (total <= 1) return `${name} hires on 1 core requirement and meets people who cover it.`;
  const tail = total > 2 ? `, then ${total - 1}, …` : `, then ${total - 1}`;
  return `${name} meets people who cover all ${total} first${tail}`;
}

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, db, query] = await Promise.all([getSession(), readDb(), searchParams]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);
  const event = db.events.find((e) => e.id === session.eventId);

  if (!applicant || !event) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold">Signals</h1>
        <p className="mt-3">Pick an applicant in the top bar</p>
      </main>
    );
  }

  const left = signalsLeft(db, event.id, applicant.id);
  const signalled = new Set(
    db.signals
      .filter((s) => s.eventId === event.id && s.applicantId === applicant.id)
      .map((s) => s.companyId),
  );
  const companyIds = new Set(
    db.companyEvents.filter((ce) => ce.eventId === event.id).map((ce) => ce.companyId),
  );
  const companies = db.companies
    .filter((c) => companyIds.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ company: c, ...coverage(db, c.id, applicant.id) }));
  const errorMessage = query.error ? ERROR_MESSAGES[query.error] : undefined;

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">
        You have {left} of {event.signalsPerApplicant} signals left for this event
      </h1>
      <p className="mt-2 text-neutral-800">
        A signal tells a company you chose them on purpose. You can signal a company once you have
        at least one accepted example for its core requirements.
      </p>
      {errorMessage ? (
        <p role="alert" className="mt-4 border border-red-800 bg-red-50 p-3 text-red-900">
          {errorMessage}
        </p>
      ) : null}
      <ul className="mt-4 space-y-4">
        {companies.map(({ company, covered, total }) => {
          const done = signalled.has(company.id);
          const noExample = covered < 1;
          const noneLeft = left <= 0;
          const reasonId = `reason-${company.id}`;
          const reason = noExample
            ? ERROR_MESSAGES["no-accepted-example"]
            : noneLeft
              ? ERROR_MESSAGES["no-signals-left"]
              : null;
          return (
            <li key={company.id} className="border border-neutral-400 p-4">
              <h2 className="text-lg font-semibold">{company.name}</h2>
              <p className="mt-1 text-neutral-800">
                {total} core {total === 1 ? "requirement" : "requirements"} · your examples: {covered} of {total}
              </p>
              <p className="mt-1 text-neutral-800">{ruleText(company.name, total)}</p>
              {done ? (
                <button type="button" disabled className="mt-3 border border-neutral-600 px-4 py-2 text-neutral-700">
                  Signalled
                </button>
              ) : (
                <form action={signalCompanyForm} className="mt-3">
                  <input type="hidden" name="companyId" value={company.id} />
                  <button
                    type="submit"
                    disabled={Boolean(reason)}
                    aria-describedby={reason ? reasonId : undefined}
                    className="bg-neutral-900 px-4 py-2 text-white disabled:bg-neutral-200 disabled:text-neutral-700"
                  >
                    Signal {company.name}
                  </button>
                  {reason ? (
                    <p id={reasonId} className="mt-2 text-neutral-800">
                      {reason}
                    </p>
                  ) : null}
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
