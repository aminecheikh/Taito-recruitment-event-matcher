export type SupportResource = {
  name: string;
  url: string;
  helpsWith: string;
  audience: "applicant" | "company" | "both";
};

export const INTERNATIONAL_SUPPORT: readonly SupportResource[] = [
  {
    name: "Work in Finland",
    url: "https://www.workinfinland.com",
    helpsWith: "Finding work and understanding how working in Finland goes",
    audience: "both",
  },
  {
    name: "InfoFinland",
    url: "https://www.infofinland.fi",
    helpsWith: "Housing, services, everyday life and moving to Finland",
    audience: "applicant",
  },
  {
    name: "Finnish Immigration Service (Migri)",
    url: "https://migri.fi",
    helpsWith: "Residence permits and the application process",
    audience: "both",
  },
  {
    name: "Business Espoo",
    url: "https://www.businessespoo.com",
    helpsWith: "Support for companies in Espoo that recruit from abroad",
    audience: "company",
  },
];

export function supportFor(audience: "applicant" | "company"): SupportResource[] {
  return INTERNATIONAL_SUPPORT.filter((s) => s.audience === audience || s.audience === "both");
}
