import { supportFor } from "@/lib/content/internationalSupport";

export function InternationalSupport({ audience }: { audience: "applicant" | "company" }) {
  return (
    <ul className="mt-3 space-y-2">
      {supportFor(audience).map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="link font-semibold">
            {s.name}
          </a>
          <span className="block text-muted">{s.helpsWith}</span>
        </li>
      ))}
    </ul>
  );
}
