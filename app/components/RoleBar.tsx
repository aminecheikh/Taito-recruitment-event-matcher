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

const control = "chrome-control";
const select = "chrome-control min-w-0 flex-1 sm:max-w-64 sm:flex-none";

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
      <div data-app-chrome className="bg-chrome text-on-chrome">
        <nav
          aria-label="Prototype controls"
          className="shell flex flex-wrap items-center gap-x-5 gap-y-2 py-2"
        >
          <span className="text-sm text-on-chrome-muted">View the prototype as</span>
          <form
            action={enterRole}
            role="group"
            aria-label="Role"
            className="flex rounded-md border border-chrome-line bg-chrome-raised p-0.5"
          >
            {ROLES.map((role) => (
              <button
                key={role}
                type="submit"
                name="role"
                value={role}
                aria-pressed={session.role === role}
                className="chrome-seg"
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </form>

          {session.role === "recruiter" && (
            <form action={pickCompany} className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
              <label htmlFor="companyId" className="text-sm text-on-chrome-muted">Company</label>
              <select id="companyId" name="companyId" defaultValue={session.companyId} className={select}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="submit" className={control}>Switch</button>
            </form>
          )}

          {session.role === "applicant" && (
            <form action={pickApplicant} className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
              <label htmlFor="applicantId" className="text-sm text-on-chrome-muted">Applicant</label>
              <select id="applicantId" name="applicantId" defaultValue={session.applicantId} className={select}>
                {applicants.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
              <button type="submit" className={control}>Switch</button>
            </form>
          )}

          {resetEnabled() ? (
            <ResetButton
              action={resetDemoData}
              className="min-h-9 text-sm text-on-chrome-muted underline underline-offset-4 hover:text-on-chrome"
            />
          ) : null}
        </nav>
      </div>
      <header data-app-chrome className="border-b border-line bg-surface">
        <div className="shell flex flex-wrap items-center gap-x-10">
          <Link href="/" className="flex min-h-14 items-center font-serif text-xl font-semibold tracking-tight text-ink">
            No CV, No Job Ad
          </Link>
          <RoleNav items={ROLE_NAV[session.role]} />
        </div>
      </header>
    </>
  );
}
