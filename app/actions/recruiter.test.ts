import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeDb } from "@/lib/domain/fixtures";
import type { Db } from "@/lib/domain/types";
import { readDb } from "@/lib/store/db";

const session = vi.hoisted(() => ({ role: "recruiter", companyId: "company-01" }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/session", () => ({
  getSession: async () => ({ role: session.role, companyId: session.companyId, applicantId: "talent-017", eventId: "event-01" }),
}));

import { inviteSelectedAction, markForLaterAction, requestMeetingAction, scoreAction } from "./recruiter";

function seed(db: Db) {
  const dir = mkdtempSync(join(tmpdir(), "recruiter-action-"));
  process.env.DB_PATH = join(dir, "db.json");
  writeFileSync(process.env.DB_PATH, JSON.stringify(db));
}

const oneSlot = (db: Db): Db => ({ ...db, events: db.events.map((e) => ({ ...e, endTime: "14:30" })) });
const meetings = async () => (await readDb()).meetings.map((m) => m.applicantId);

beforeEach(() => {
  seed(makeDb());
  session.role = "recruiter";
  session.companyId = "company-01";
});

describe("inviteSelectedAction", () => {
  test("inviteSelected_twoApplicants_bothRequested", async () => {
    expect(await inviteSelectedAction(["talent-017", "talent-020"])).toEqual({ ok: true, invited: 2, alreadyInvited: 0 });
    expect(await meetings()).toEqual(["talent-017", "talent-020"]);
  });

  test("inviteSelected_againAfterInvite_saysAlreadyInvitedAndAddsNothing", async () => {
    await requestMeetingAction("talent-017");
    expect(await inviteSelectedAction(["talent-017", "talent-020"])).toEqual({ ok: true, invited: 1, alreadyInvited: 1 });
    expect(await inviteSelectedAction(["talent-017"])).toEqual({ ok: true, invited: 0, alreadyInvited: 1 });
    expect(await meetings()).toHaveLength(2);
  });

  test("inviteSelected_moreThanFreeSlots_warnsAndSendsNone", async () => {
    seed(oneSlot(makeDb()));
    const res = await inviteSelectedAction(["talent-017", "talent-020"]);
    expect(res).toEqual({
      ok: false,
      error: "Only 1 free meeting slot left, and you selected 2 new invites. No invites were sent. Please recheck your selection.",
    });
    expect(await meetings()).toEqual([]);
  });

  test("inviteSelected_otherCompanysApplicants_refused", async () => {
    session.companyId = "company-02";
    expect(await inviteSelectedAction(["talent-017"])).toEqual({ ok: false, error: "This applicant has not signalled your company." });
    expect(await meetings()).toEqual([]);
  });

  test("inviteSelected_notRecruiter_refused", async () => {
    session.role = "applicant";
    expect((await inviteSelectedAction(["talent-017"])).ok).toBe(false);
    expect(await meetings()).toEqual([]);
  });

  test("inviteSelected_badInput_refused", async () => {
    expect(await inviteSelectedAction([])).toEqual({ ok: false, error: "Select at least one applicant first." });
    expect((await inviteSelectedAction("talent-017" as unknown as string[])).ok).toBe(false);
  });
});

describe("markForLaterAction", () => {
  test("markForLater_markAndUnmark", async () => {
    expect(await markForLaterAction(["talent-020"], true)).toEqual({ ok: true });
    expect((await readDb()).marks).toEqual([{ eventId: "event-01", companyId: "company-01", applicantId: "talent-020" }]);
    expect(await markForLaterAction(["talent-020"], false)).toEqual({ ok: true });
    expect((await readDb()).marks).toEqual([]);
  });

  test("markForLater_notRecruiter_refused", async () => {
    session.role = "staff";
    expect((await markForLaterAction(["talent-020"], true)).ok).toBe(false);
    expect((await readDb()).marks).toEqual([]);
  });
});

describe("existing single flows still work", () => {
  test("requestMeetingAction_single_unchanged", async () => {
    expect(await requestMeetingAction("talent-017")).toEqual({ ok: true });
    expect(await requestMeetingAction("talent-017")).toEqual({ ok: false, error: "You already requested this meeting." });
  });

  test("scoreAction_cardScore_stillStored", async () => {
    expect(await scoreAction("talent-017", "req-01-1", 6, "card")).toEqual({ ok: true });
    expect((await readDb()).scores).toMatchObject([{ applicantId: "talent-017", value: 6 }]);
  });
});
