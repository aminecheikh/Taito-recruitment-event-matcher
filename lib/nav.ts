import type { Role } from "@/lib/session";

/** badge: a count shown as a small circle on the tab, e.g. unanswered meeting requests. */
export type NavItem = { label: string; href: string; badge?: number };

export const ROLE_NAV: Record<Role, readonly NavItem[]> = {
  recruiter: [
    { label: "Core requirements", href: "/recruiter/requirements" },
    { label: "Who signalled us", href: "/recruiter/applicants" },
    { label: "Meetings", href: "/recruiter/meetings" },
  ],
  applicant: [
    { label: "My stories", href: "/applicant/stories" },
    { label: "Companies", href: "/applicant/companies" },
    { label: "Saved entries", href: "/applicant/entries" },
    { label: "Signals", href: "/applicant/signals" },
    { label: "Meetings", href: "/applicant/meetings" },
  ],
  staff: [
    { label: "Who might need help", href: "/staff" },
    { label: "Event insights", href: "/staff/insights" },
  ],
};

/** The one nav item the path belongs to: exact match or a sub-page, longest href wins (/staff/insights, not /staff). */
export function currentNavHref(items: readonly NavItem[], pathname: string): string | undefined {
  return items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .reduce<string | undefined>((best, item) => (best && best.length >= item.href.length ? best : item.href), undefined);
}

export const ROLE_HOME: Record<Role, string> = {
  recruiter: ROLE_NAV.recruiter[0].href,
  applicant: ROLE_NAV.applicant[0].href,
  staff: ROLE_NAV.staff[0].href,
};

export const MAX_BADGE = 9;

/** Text for a nav notification badge: nothing at 0, the number up to 9, then "9+". */
export function badgeText(count: number): string | null {
  if (count <= 0) return null;
  return count > MAX_BADGE ? `${MAX_BADGE}+` : String(count);
}
