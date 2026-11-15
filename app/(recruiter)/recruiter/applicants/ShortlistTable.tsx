import Link from "next/link";
import type { ShortlistRow } from "@/lib/domain/scores";

type Props = {
  scored: ShortlistRow[];
  notScored: ShortlistRow[];
  requirementIds: string[];
  cardsHref: string;
};

function legend(count: number): string {
  const parts = Array.from({ length: count }, (_, i) => `#${i + 1} counts ${count - i}×`);
  return `Your scores, weighted by your ranking: ${parts.join(", ")}. Applicants you haven't scored stay listed below.`;
}

function Rows({ rows, requirementIds, cardsHref }: { rows: ShortlistRow[]; requirementIds: string[]; cardsHref: string }) {
  return (
    <>
      {rows.map((row) => (
        <tr key={row.applicantId} className="border-t border-line">
          <td className="py-2 pr-4">
            <Link href={`${cardsHref}#card-${row.applicantId}`} className="link">
              {row.label}
            </Link>
          </td>
          <td className="py-2 pr-4">{row.covered} of {row.total}</td>
          {requirementIds.map((id) => (
            <td key={id} className="py-2 pr-4">{row.scores[id] ?? "–"}</td>
          ))}
          <td className="py-2">{row.weighted === undefined ? <span className="text-muted">not scored</span> : row.weighted}</td>
        </tr>
      ))}
    </>
  );
}

/** Recruiter-only table of their own scores. Nothing here is computed or ranked by AI. */
export function ShortlistTable({ scored, notScored, requirementIds, cardsHref }: Props) {
  return (
    <div className="mt-6">
      <p className="hint">{legend(requirementIds.length)}</p>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th scope="col" className="label pb-2 pr-4">Applicant</th>
              <th scope="col" className="label pb-2 pr-4">Coverage</th>
              {requirementIds.map((id, i) => (
                <th key={id} scope="col" className="label pb-2 pr-4">#{i + 1}</th>
              ))}
              <th scope="col" className="label pb-2">Weighted</th>
            </tr>
          </thead>
          <tbody>
            <Rows rows={scored} requirementIds={requirementIds} cardsHref={cardsHref} />
            {notScored.length > 0 ? (
              <tr className="border-t border-line-strong">
                <th scope="rowgroup" colSpan={requirementIds.length + 3} className="label pt-4 pb-1">
                  Not scored yet
                </th>
              </tr>
            ) : null}
            <Rows rows={notScored} requirementIds={requirementIds} cardsHref={cardsHref} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
