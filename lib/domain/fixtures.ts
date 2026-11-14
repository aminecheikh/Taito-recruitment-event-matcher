import { emptyDb, type Applicant, type Db, type Link, type Requirement, type Story } from "./types";

const COMPANY_ID = "company-01";
const EVENT_ID = "event-01";
const CORE_COUNT = 4;
const REQUIREMENT_COUNT = 6;

function makeRequirement(index: number): Requirement {
  return {
    id: `req-01-${index}`,
    companyId: COMPANY_ID,
    text: `Requirement ${index}`,
    inPractice: `What requirement ${index} looks like in practice`,
    rank: index,
    isCore: index <= CORE_COUNT,
  };
}

function makeApplicant(num: string): Applicant {
  return {
    id: `talent-${num}`,
    pseudonym: `Applicant ${num}`,
    displayName: `Demo Person ${num}`,
    contact: { email: `talent-${num}@example.org` },
  };
}

function makeStory(id: string, applicantId: string): Story {
  return { id, applicantId, title: `Story ${id}`, body: `Body of ${id}` };
}

function makeLink(id: string, storyId: string, requirementId: string, status: Link["status"]): Link {
  return { id, storyId, requirementId, origin: "applicant", status };
}

/** Test-only builder: one company (4 core of 6 requirements), two applicants, stories, links. */
export function makeDb(overrides: Partial<Db> = {}): Db {
  const base: Db = {
    ...emptyDb(),
    companies: [{ id: COMPANY_ID, name: "Demo Company", sector: "Services", sizeRange: "50-200" }],
    requirements: Array.from({ length: REQUIREMENT_COUNT }, (_, i) => makeRequirement(i + 1)),
    events: [
      {
        id: EVENT_ID,
        name: "Demo Event",
        date: "2026-11-14",
        location: "Demo Hall",
        startTime: "14:00",
        endTime: "18:00",
        signalsPerApplicant: 3,
      },
    ],
    companyEvents: [{ companyId: COMPANY_ID, eventId: EVENT_ID }],
    applicantEvents: ["talent-017", "talent-020"].map((applicantId) => ({ applicantId, eventId: EVENT_ID })),
    applicants: [makeApplicant("017"), makeApplicant("020")],
    stories: [
      makeStory("story-017-a", "talent-017"),
      makeStory("story-017-b", "talent-017"),
      makeStory("story-020-a", "talent-020"),
      makeStory("story-020-b", "talent-020"),
    ],
    links: [
      makeLink("link-017-1", "story-017-a", "req-01-2", "accepted"),
      makeLink("link-017-2", "story-017-b", "req-01-3", "pending"),
      makeLink("link-017-3", "story-017-b", "req-01-4", "rejected"),
      makeLink("link-020-1", "story-020-a", "req-01-1", "accepted"),
      makeLink("link-020-2", "story-020-a", "req-01-3", "accepted"),
      makeLink("link-020-3", "story-020-b", "req-01-4", "accepted"),
    ],
    signals: ["talent-017", "talent-020"].map((applicantId) => ({
      eventId: EVENT_ID,
      applicantId,
      companyId: COMPANY_ID,
    })),
  };
  return { ...base, ...overrides };
}
