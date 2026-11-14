import Link from "next/link";
import { getSession, ROLES, type Role } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { enterRole, setSession } from "@/app/actions/session";
import { ROLE_NAV } from "@/lib/nav";
import { RoleNav } from "./RoleNav";
import { resetDemoData } from "@/app/actions/reset";
import { resetEnabled } from "@/lib/demoReset";
import { ResetButton } from "./ResetButton";

const ROLE_LABELS: Record<Role, string> = {
  recruiter: "Recruiter",
  applicant: "Applicant",
  staff: "Event staff",
};

const control = "btn min-h-10 px-3 text-sm";
const select = "field field-inline min-h-10 py-1 text-sm";

export async function RoleBar() {
  const [session, db] = await Promise.all([getSession(), readDb()]);

  async function pickCompany(formData: FormData) {
    "use server";
    await setSession({ companyId: String(formData.get("companyId")) });
  }
  async function pickApplicant(formData: FormData) {
    "use server";
    await setSession({ applicantId: String(formData.get("applicantId")) });
  }

  const companies = db.companies.length
    ? db.companies
    : [{ id: session.companyId, name: session.companyId }];
  const applicants = db.applicants.length
    ? db.applicants.map((a) => ({ id: a.id, label: a.pseudonym }))
    : [{ id: session.applicantId, label: session.applicantId }];

  return (
    <>
      <div data-app-chrome className="border-b border-line bg-sunken">
        <nav
          aria-label="Demo controls"
          className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6"
        >
          <span className="eyebrow">Demo</span>
          <form
            action={enterRole}
            role="group"
            aria-label="Role"
            className="flex rounded-lg border border-line-strong bg-surface p-0.5"
          >
            {ROLES.map((role) => (
              <button
                key={role}
                type="submit"
                name="role"
                value={role}
                aria-pressed={session.role === role}
                className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${
                  session.role === role ? "bg-accent text-[var(--on-accent)]" : "text-ink hover:bg-sunken"
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </form>

          {session.role === "recruiter" && (
            <form action={pickCompany} className="flex items-center gap-2">
              <label htmlFor="companyId" className="text-sm text-muted">Company</label>
              <select id="companyId" name="companyId" defaultValue={session.companyId} className={select}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="submit" className={control}>Switch</button>
            </form>
          )}

          {session.role === "applicant" && (
            <form action={pickApplicant} className="flex items-center gap-2">
              <label htmlFor="applicantId" className="text-sm text-muted">Applicant</label>
              <select id="applicantId" name="applicantId" defaultValue={session.applicantId} className={select}>
                {applicants.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
              <button type="submit" className={control}>Switch</button>
            </form>
          )}

          {resetEnabled() ? <ResetButton action={resetDemoData} className="btn btn-quiet min-h-10 px-3 text-sm" /> : null}
        </nav>
      </div>
      <header data-app-chrome className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 px-4 sm:px-6">
          <Link href="/" className="flex min-h-12 items-center font-serif text-lg font-semibold tracking-tight text-ink">
            No CV, No Job Ad
          </Link>
          <RoleNav items={ROLE_NAV[session.role]} />
        </div>
      </header>
    </>
  );
}
