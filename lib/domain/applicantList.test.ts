import { describe, expect, test } from "vitest";
import { isMarked, recruiterList, requestMeetings, setMarked } from "./applicantList";
import { makeDb } from "./fixtures";
import { requestMeeting } from "./meetings";
import type { Db } from "./types";

const EVENT = "event-01";
const COMPANY = "company-01";
const ALL = { minCovered: 0, markedOnly: false };

function oneSlot(db: Db): Db {
  return { ...db, events: db.events.map((e) => ({ ...e, startTime: "14:00", endTime: "14:30" })) };
}

function invited(db: Db, id: string): Db {
  const r = requestMeeting(db, EVENT, COMPANY, id);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

describe("recruiterList", () => {
  test("recruiterList_scoreFloor_hidesScoredBelowButKeepsUnscored", () => {
    const db = makeDb();
    const core = db.requirements.filter((r) => r.companyId === COMPANY && r.isCore);
    const low = core.map((r) => ({ companyId: COMPANY, applicantId: "talent-020", requirementId: r.id, stage: "card" as const, value: 1 }));
    const scored = { ...db, scores: low };
    expect(recruiterList(scored, EVENT, COMPANY, { ...ALL, minWeighted: 50 })).toEqual(["talent-017"]);
    expect(recruiterList(scored, EVENT, COMPANY, { ...ALL, minWeighted: 10 })).toEqual(["talent-017", "talent-020"]);
  });

  test("recruiterList_noFilters_listsEverySignalledApplicant", () =>
    expect(recruiterList(makeDb(), EVENT, COMPANY, ALL)).toEqual(["talent-017", "talent-020"]));

  test("recruiterList_applicantInvited_leavesTheList", () =>
    expect(recruiterList(invited(makeDb(), "talent-017"), EVENT, COMPANY, ALL)).toEqual(["talent-020"]));

  test("recruiterList_coverageFilter_keepsOnlyEnoughExamples", () =>
    expect(recruiterList(makeDb(), EVENT, COMPANY, { minCovered: 2, markedOnly: false })).toEqual(["talent-020"]));

  test("recruiterList_markedOnly_keepsOnlyMarked", () => {
    const r = setMarked(makeDb(), EVENT, COMPANY, ["talent-020"], true);
    expect(r.ok && recruiterList(r.value, EVENT, COMPANY, { minCovered: 0, markedOnly: true })).toEqual(["talent-020"]);
  });
});

describe("requestMeetings", () => {
  test("requestMeetings_twoSelected_invitesBothThroughRequestMeeting", () => {
    const r = requestMeetings(makeDb(), EVENT, COMPANY, ["talent-017", "talent-020"]);
    expect(r.ok && { invited: r.value.invited, alreadyInvited: r.value.alreadyInvited }).toEqual({ invited: 2, alreadyInvited: 0 });
    expect(r.ok && r.value.db.meetings.map((m) => [m.applicantId, m.status])).toEqual([
      ["talent-017", "requested"],
      ["talent-020", "requested"],
    ]);
  });

  test("requestMeetings_someAlreadyInvited_skipsThemAndCounts", () => {
    const db = invited(makeDb(), "talent-017");
    const r = requestMeetings(db, EVENT, COMPANY, ["talent-017", "talent-020", "talent-020"]);
    expect(r.ok && { invited: r.value.invited, alreadyInvited: r.value.alreadyInvited }).toEqual({ invited: 1, alreadyInvited: 1 });
    expect(r.ok && r.value.db.meetings).toHaveLength(2);
  });

  test("requestMeetings_allAlreadyInvited_changesNothing", () => {
    const db = invited(makeDb(), "talent-017");
    const r = requestMeetings(db, EVENT, COMPANY, ["talent-017"]);
    expect(r.ok && r.value).toMatchObject({ invited: 0, alreadyInvited: 1, db });
  });

  test("requestMeetings_moreThanFreeSlots_sendsNoInvites", () => {
    const db = oneSlot(makeDb());
    expect(requestMeetings(db, EVENT, COMPANY, ["talent-017", "talent-020"])).toEqual({
      ok: false,
      error: "not-enough-slots",
      selected: 2,
      slotsLeft: 1,
    });
  });

  test("requestMeetings_applicantDidNotSignal_refusesWholeBatch", () =>
    expect(requestMeetings(makeDb(), EVENT, COMPANY, ["talent-017", "talent-999"])).toEqual({ ok: false, error: "no-signal" }));

  test("requestMeetings_otherCompany_refused", () =>
    expect(requestMeetings(makeDb(), EVENT, "company-02", ["talent-017"])).toEqual({ ok: false, error: "no-signal" }));

  test("requestMeetings_emptySelection_refused", () =>
    expect(requestMeetings(makeDb(), EVENT, COMPANY, [])).toEqual({ ok: false, error: "nothing-selected" }));

  test("requestMeetings_doesNotMutateInput", () => {
    const db = makeDb();
    requestMeetings(db, EVENT, COMPANY, ["talent-017"]);
    expect(db.meetings).toEqual([]);
  });
});

describe("setMarked", () => {
  test("setMarked_markThenUnmark_isReversible", () => {
    const marked = setMarked(makeDb(), EVENT, COMPANY, ["talent-017"], true);
    expect(marked.ok && isMarked(marked.value, EVENT, COMPANY, "talent-017")).toBe(true);
    const unmarked = marked.ok ? setMarked(marked.value, EVENT, COMPANY, ["talent-017"], false) : marked;
    expect(unmarked.ok && unmarked.value.marks).toEqual([]);
  });

  test("setMarked_markTwice_keepsOneMark", () => {
    const once = setMarked(makeDb(), EVENT, COMPANY, ["talent-017"], true);
    const twice = once.ok ? setMarked(once.value, EVENT, COMPANY, ["talent-017", "talent-017"], true) : once;
    expect(twice.ok && twice.value.marks).toHaveLength(1);
  });

  test("setMarked_otherCompanysMark_untouched", () => {
    const db = { ...makeDb(), marks: [{ eventId: EVENT, companyId: "company-02", applicantId: "talent-017" }] };
    const r = setMarked(db, EVENT, COMPANY, ["talent-017"], false);
    expect(r.ok && r.value.marks).toEqual(db.marks);
  });

  test("setMarked_applicantDidNotSignal_refused", () =>
    expect(setMarked(makeDb(), EVENT, COMPANY, ["talent-999"], true)).toEqual({ ok: false, error: "no-signal" }));
});
