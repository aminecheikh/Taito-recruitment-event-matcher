import { exportApplicantData } from "@/lib/domain/privacy";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

const FILENAME = "taito-my-data.json";

/** The session applicant's own data as a download. Applicant role only; never includes recruiter scores. */
export async function GET(): Promise<Response> {
  const session = await getSession();
  if (session.role !== "applicant") return Response.json({ error: "Switch to the applicant role first." }, { status: 403 });
  const data = exportApplicantData(await readDb(), session.applicantId);
  if (!data) return Response.json({ error: "Pick an applicant in the top bar." }, { status: 404 });
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${FILENAME}"`,
      "Cache-Control": "no-store",
    },
  });
}
