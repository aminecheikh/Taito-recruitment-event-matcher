import Link from "next/link";
import { getSession, ROLES, type Role } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { enterRole, pickEvent, setSession } from "@/app/actions/session";
import { ROLE_NAV } from "@/lib/nav";
import { RoleNav } from "./RoleNav";
import { resetDemoData } from "@/app/actions/reset";
import { resetEnabled } from "@/lib/demoReset";
import { ResetButton } from "./ResetButton";
import { ThemeSwitch } from "./ThemeSwitch";
import { Logo } from "./Logo";
import { cookies } from "next/headers";
import { formatShortDate } from "@/lib/domain/eventFormat";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import { applicantsAt, companiesAt } from "@/lib/domain/attendance";
import { pendingRequestCount } from "@/lib/domain/meetings";

const ROLE_LABELS: Record<Role, string> = {
  recruiter: "Recruiter",
  applicant: "Applicant",
  staff: "Event staff",
};

const control = "chrome-control";
const select = "chrome-control min-w-0 flex-1 sm:max-w-64 sm:flex-none";

export async function RoleBar() {
  const [session, db, jar] = await Promise.all([getSession(), readDb(), cookies()]);
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);

  async function pickCompany(formData: FormData) {
    "use server";
    await setSession({ companyId: String(formData.get("companyId")) });
  }
  async function pickApplicant(formData: FormData) {
    "use server";
    await setSession({ applicantId: String(formData.get("applicantId")) });
  }

  // The applicant's Meetings tab shows how many company requests are still waiting for an answer.
  const requests = session.role === "applicant" ? pendingRequestCount(db, session.eventId, session.applicantId) : 0;
  const navItems = ROLE_NAV[session.role].map((item) =>
    item.href === "/applicant/meetings" ? { ...item, badge: requests } : item,
  );

  const companyIds = new Set(companiesAt(db, session.eventId));
  const applicantIds = new Set(applicantsAt(db, session.eventId));
  const attendingCompanies = db.companies.filter((c) => companyIds.has(c.id));
  const attendingApplicants = db.applicants.filter((a) => applicantIds.has(a.id));
  const companies = attendingCompanies.length
    ? attendingCompanies
    : [{ id: session.companyId, name: session.companyId }];
  const applicants = attendingApplicants.length
    ? attendingApplicants.map((a) => ({ id: a.id, label: a.pseudonym }))
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
            className="seg seg-chrome"
            style={{ "--n": ROLES.length, "--i": ROLES.indexOf(session.role) } as React.CSSProperties}
          >
            <span aria-hidden="true" className="seg-thumb" />
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

          {db.events.length > 0 && (
            <form action={pickEvent} className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
              <label htmlFor="eventId" className="text-sm text-on-chrome-muted">Event</label>
              <select id="eventId" name="eventId" defaultValue={session.eventId} className={select}>
                {db.events.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}, {formatShortDate(e.date)}</option>
                ))}
              </select>
              <button type="submit" className={control}>Switch</button>
            </form>
          )}

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
      <header data-app-chrome className="material scroll-edge sticky top-0 z-30">
        <div className="shell flex flex-wrap items-center gap-x-10">
          <Link href="/" aria-label="Taito, home" className="order-1 flex min-h-16 items-center">
            <Logo />
          </Link>
          <div className="order-3 w-full min-w-0 lg:order-2 lg:w-auto">
            <RoleNav items={navItems} />
          </div>
          <div className="order-2 ml-auto py-2 lg:order-3">
            <ThemeSwitch initial={theme} />
          </div>
        </div>
      </header>
    </>
  );
}
