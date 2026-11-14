import { z } from "zod";

export const MAX_CORE_REQUIREMENTS = 5;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  sector: z.string(),
  sizeRange: z.string(),
});

export const RequirementSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  text: z.string(),
  inPractice: z.string(),
  rank: z.number().int().min(1),
  isCore: z.boolean(),
});

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TimeSchema = z.string().regex(TIME_PATTERN);

export const EventSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    date: z.string(),
    location: z.string(),
    startTime: TimeSchema,
    endTime: TimeSchema,
    signalsPerApplicant: z.number().int().min(0),
  })
  .refine((e) => e.endTime > e.startTime, { message: "endTime must be after startTime", path: ["endTime"] });

/** The company attends the event. */
export const CompanyEventSchema = z.object({
  companyId: z.string(),
  eventId: z.string(),
});

/** The applicant is registered for the event. */
export const ApplicantEventSchema = z.object({
  applicantId: z.string(),
  eventId: z.string(),
});

export const ApplicantSchema = z.object({
  id: z.string(),
  pseudonym: z.string(),
  displayName: z.string(),
  contact: z.object({ email: z.string() }),
});

export const LanguageLabelSchema = z.union([
  z.literal("language edited"),
  z.templateLiteral(["translated from ", z.string()]),
]);
export type LanguageLabel = z.infer<typeof LanguageLabelSchema>;

export const StorySchema = z.object({
  id: z.string(),
  applicantId: z.string(),
  title: z.string(),
  body: z.string(),
  languageLabel: LanguageLabelSchema.optional(),
});

export const LinkSchema = z.object({
  id: z.string(),
  storyId: z.string(),
  requirementId: z.string(),
  origin: z.enum(["ai-suggested", "applicant"]),
  aiReason: z.string().optional(),
  status: z.enum(["pending", "accepted", "rejected"]),
});

/** One example the applicant wrote; lives in their registry and can answer several requirements. */
export const EntrySchema = z.object({
  id: z.string(),
  applicantId: z.string(),
  body: z.string(),
  languageLabel: LanguageLabelSchema.optional(),
  /** The story the applicant started from, if any (provenance only). */
  sourceStoryId: z.string().optional(),
});

/** The applicant's answer on one requirement card: which saved entry fills it. One per (applicant, requirement). */
export const AnswerSchema = z.object({
  applicantId: z.string(),
  requirementId: z.string(),
  entryId: z.string(),
});

export const SignalSchema = z.object({
  eventId: z.string(),
  applicantId: z.string(),
  companyId: z.string(),
});

export const MeetingSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  companyId: z.string(),
  applicantId: z.string(),
  status: z.enum(["requested", "booked"]),
  /** Slot start (HH:MM). Set when booked; a requested meeting has none. */
  slotStart: TimeSchema.optional(),
});

export const DecisionSchema = z.object({
  meetingId: z.string(),
  side: z.enum(["company", "applicant"]),
  continue: z.boolean(),
  feedback: z.record(z.string(), z.string()).optional(),
});

export const ShareSchema = z.object({
  meetingId: z.string(),
  applicant: z
    .object({
      contact: z.string().optional(),
      cvUrl: z.string().optional(),
      links: z.array(z.string()).optional(),
    })
    .optional(),
  company: z
    .object({
      contactPerson: z.string(),
      nextStep: z.string(),
      timeline: z.string(),
    })
    .optional(),
});

export const ScoreSchema = z.object({
  companyId: z.string(),
  applicantId: z.string(),
  requirementId: z.string(),
  stage: z.enum(["card", "conversation"]),
  value: z.number().int().min(0).max(10),
});

export type Company = z.infer<typeof CompanySchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type Event = z.infer<typeof EventSchema>;
export type CompanyEvent = z.infer<typeof CompanyEventSchema>;
export type ApplicantEvent = z.infer<typeof ApplicantEventSchema>;
export type Applicant = z.infer<typeof ApplicantSchema>;
export type Story = z.infer<typeof StorySchema>;
export type Link = z.infer<typeof LinkSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type Meeting = z.infer<typeof MeetingSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Share = z.infer<typeof ShareSchema>;
export type Score = z.infer<typeof ScoreSchema>;

export type Db = {
  companies: Company[];
  requirements: Requirement[];
  events: Event[];
  companyEvents: CompanyEvent[];
  applicantEvents: ApplicantEvent[];
  applicants: Applicant[];
  stories: Story[];
  links: Link[];
  entries: Entry[];
  answers: Answer[];
  signals: Signal[];
  meetings: Meeting[];
  decisions: Decision[];
  shares: Share[];
  scores: Score[];
};

export const DbSchema: z.ZodType<Db> = z.object({
  companies: z.array(CompanySchema),
  requirements: z.array(RequirementSchema),
  events: z.array(EventSchema),
  companyEvents: z.array(CompanyEventSchema),
  applicantEvents: z.array(ApplicantEventSchema),
  applicants: z.array(ApplicantSchema),
  stories: z.array(StorySchema),
  links: z.array(LinkSchema),
  entries: z.array(EntrySchema).default([]),
  answers: z.array(AnswerSchema).default([]),
  signals: z.array(SignalSchema),
  meetings: z.array(MeetingSchema),
  decisions: z.array(DecisionSchema),
  shares: z.array(ShareSchema),
  scores: z.array(ScoreSchema),
});

export function emptyDb(): Db {
  return {
    companies: [],
    requirements: [],
    events: [],
    companyEvents: [],
    applicantEvents: [],
    applicants: [],
    stories: [],
    links: [],
    entries: [],
    answers: [],
    signals: [],
    meetings: [],
    decisions: [],
    shares: [],
    scores: [],
  };
}
