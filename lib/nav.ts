import type { Role } from "@/lib/session";

export type NavItem = { label: string; href: string };

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
  staff: [{ label: "Who might need help", href: "/staff" }],
};

export const ROLE_HOME: Record<Role, string> = {
  recruiter: ROLE_NAV.recruiter[0].href,
  applicant: ROLE_NAV.applicant[0].href,
  staff: ROLE_NAV.staff[0].href,
};
