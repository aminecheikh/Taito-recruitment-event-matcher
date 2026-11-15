import { revealDecisions } from "./decisions";
import type { Answer, Applicant, Db, Decision, Entry, Meeting, Result, Share, Signal, Story } from "./types";

/** Days an applicant's data is kept after the event before it is deleted. */
export const RETENTION_DAYS = 30;

export type PersonalDataField = {
  collection: keyof Db;
  field: string;
  purpose: string;
  whoSees: string;
  deletedWhen: string;
};

const ON_REQUEST = `When you press "Delete all my data", or ${RETENTION_DAYS} days after the event`;

export const PERSONAL_DATA_FIELDS: readonly PersonalDataField[] = [
  {
    collection: "applicants",
    field: "pseudonym",
    purpose: "Shown to companies instead of your name until both sides continue",
    whoSees: "You and recruiters you signal",
    deletedWhen: ON_REQUEST,
  },
  {
    collection: "applicants",
    field: "displayName",
    purpose: "Shown only to you, so you recognise your own profile",
    whoSees: "You",
    deletedWhen: ON_REQUEST,
  },
  {
    collection: "applicants",
    field: "contact",
    purpose: "Lets you share how to reach you after a match, only if you choose to",
    whoSees: "You; a company only after you both continue and you share it",
    deletedWhen: ON_REQUEST,
  },
  {
    collection: "stories",
    field: "body",
    purpose: "Your own words about what you have done, the evidence behind your answers",
    whoSees: "You; the AI when you ask for help",
    deletedWhen: `When you delete the story, or ${ON_REQUEST}`,
  },
  {
    collection: "entries",
    field: "body",
    purpose: "The example you chose to answer one requirement card",
    whoSees: "You; recruiters of companies you signal",
    deletedWhen: ON_REQUEST,
  },
  {
    collection: "shares",
    field: "applicant",
    purpose: "Contact details you chose to hand over after a match",
    whoSees: "You and the matched company",
    deletedWhen: ON_REQUEST,
  },
  {
    collection: "scores",
    field: "value",
    purpose: "A recruiter's own rating of an answer, used only by that recruiter",
    whoSees: "The recruiter's company; never shown to you in the export",
    deletedWhen: ON_REQUEST,
  },
  {
    collection: "decisions",
    field: "feedback",
    purpose: "Reasons a company gives when it does not continue, so you can learn from the meeting",
    whoSees: "You, after both decisions are in",
    deletedWhen: ON_REQUEST,
  },
];

export type ApplicantExport = {
  applicant: Applicant;
  stories: Story[];
  entries: Entry[];
  answers: Answer[];
  signals: Signal[];
  meetings: (Meeting & { companyName: string })[];
  decisions: Decision[];
  feedback: { meetingId: string; feedback: Record<string, string> }[];
  shares: Share[];
};

/** Everything held about one applicant. Recruiter scores are deliberately left out. */
export function exportApplicantData(db: Db, applicantId: string): ApplicantExport | null {
  const applicant = db.applicants.find((a) => a.id === applicantId);
  if (!applicant) return null;
  const mine = db.meetings.filter((m) => m.applicantId === applicantId);
  const meetingIds = new Set(mine.map((m) => m.id));
  const feedback = mine.flatMap((m) => {
    const reveal = revealDecisions(db, m.id);
    return reveal.status === "revealed" && reveal.feedback ? [{ meetingId: m.id, feedback: reveal.feedback }] : [];
  });
  return {
    applicant,
    stories: db.stories.filter((s) => s.applicantId === applicantId),
    entries: db.entries.filter((e) => e.applicantId === applicantId),
    answers: db.answers.filter((a) => a.applicantId === applicantId),
    signals: db.signals.filter((s) => s.applicantId === applicantId),
    meetings: mine.map((m) => ({ ...m, companyName: db.companies.find((c) => c.id === m.companyId)?.name ?? m.companyId })),
    decisions: db.decisions.filter((d) => d.side === "applicant" && meetingIds.has(d.meetingId)),
    feedback,
    shares: db.shares.filter((s) => meetingIds.has(s.meetingId)),
  };
}

export function deleteApplicantData(db: Db, applicantId: string): Result<Db> {
  if (!db.applicants.some((a) => a.id === applicantId)) return { ok: false, error: "not-found" };
  const meetingIds = new Set(db.meetings.filter((m) => m.applicantId === applicantId).map((m) => m.id));
  const storyIds = new Set(db.stories.filter((s) => s.applicantId === applicantId).map((s) => s.id));
  return {
    ok: true,
    value: {
      ...db,
      applicants: db.applicants.filter((a) => a.id !== applicantId),
      applicantEvents: db.applicantEvents.filter((a) => a.applicantId !== applicantId),
      stories: db.stories.filter((s) => s.applicantId !== applicantId),
      links: db.links.filter((l) => !storyIds.has(l.storyId)),
      entries: db.entries.filter((e) => e.applicantId !== applicantId),
      answers: db.answers.filter((a) => a.applicantId !== applicantId),
      signals: db.signals.filter((s) => s.applicantId !== applicantId),
      meetings: db.meetings.filter((m) => m.applicantId !== applicantId),
      decisions: db.decisions.filter((d) => !meetingIds.has(d.meetingId)),
      shares: db.shares.filter((s) => !meetingIds.has(s.meetingId)),
      scores: db.scores.filter((s) => s.applicantId !== applicantId),
    },
  };
}

export function deleteStory(db: Db, applicantId: string, storyId: string): Result<Db> {
  if (!db.stories.some((s) => s.id === storyId && s.applicantId === applicantId)) return { ok: false, error: "not-found" };
  return {
    ok: true,
    value: {
      ...db,
      stories: db.stories.filter((s) => s.id !== storyId),
      links: db.links.filter((l) => l.storyId !== storyId),
      entries: db.entries.map((e) => {
        if (e.sourceStoryId !== storyId) return e;
        return Object.fromEntries(Object.entries(e).filter(([key]) => key !== "sourceStoryId")) as Entry;
      }),
    },
  };
}
