import { getSession, ROLES, type Role } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { setSession } from "@/app/actions/session";
import { resetDemoData } from "@/app/actions/reset";

const ROLE_LABELS: Record<Role, string> = {
  recruiter: "Recruiter",
  applicant: "Applicant",
  staff: "Event staff",
};

const control =
  "min-h-11 rounded border border-neutral-700 bg-white px-3 text-sm text-neutral-900";

export async function RoleBar() {
  const [session, db] = await Promise.all([getSession(), readDb()]);

  async function pickRole(formData: FormData) {
    "use server";
    await setSession({ role: String(formData.get("role")) as Role });
  }
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
    <nav aria-label="Demo controls" className="flex flex-wrap items-center gap-3 border-b border-neutral-300 bg-neutral-100 px-4 py-3">
      <form action={pickRole} className="flex gap-1" role="group" aria-label="Role">
        {ROLES.map((role) => (
          <button
            key={role}
            type="submit"
            name="role"
            value={role}
            aria-pressed={session.role === role}
            className={`min-h-11 rounded border px-3 text-sm font-medium ${
              session.role === role
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-700 bg-white text-neutral-900"
            }`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </form>

      {session.role === "recruiter" && (
        <form action={pickCompany} className="flex items-center gap-2">
          <label htmlFor="companyId" className="text-sm">Company</label>
          <select id="companyId" name="companyId" defaultValue={session.companyId} className={control}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className={control}>Switch</button>
        </form>
      )}

      {session.role === "applicant" && (
        <form action={pickApplicant} className="flex items-center gap-2">
          <label htmlFor="applicantId" className="text-sm">Applicant</label>
          <select id="applicantId" name="applicantId" defaultValue={session.applicantId} className={control}>
            {applicants.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          <button type="submit" className={control}>Switch</button>
        </form>
      )}

      <form action={resetDemoData} className="sm:ml-auto">
        <button type="submit" className={control}>Reset demo data</button>
      </form>
    </nav>
  );
}
