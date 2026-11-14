import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MockLanguageModelV4 } from "ai/test";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeDb } from "@/lib/domain/fixtures";
import type { Db } from "@/lib/domain/types";

const state = vi.hoisted(() => ({
  role: "recruiter",
  prompts: [] as string[],
  reply: "" as string,
  model: "ok" as "ok" | "none" | "throws",
}));

vi.mock("@/lib/session", () => ({
  getSession: async () => ({ role: state.role, companyId: "company-01", applicantId: "talent-017", eventId: "event-01" }),
}));

vi.mock("@/lib/ai/provider", () => ({
  getModel: () => {
    if (state.model === "none") return null;
    return new MockLanguageModelV4({
      doGenerate: async (options) => {
        state.prompts.push(JSON.stringify(options.prompt));
        if (state.model === "throws") throw new Error("provider down");
        return {
          content: [{ type: "text", text: state.reply }],
          finishReason: { unified: "stop", raw: "stop" },
          usage: {
            inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 1, text: 1, reasoning: 0 },
          },
          warnings: [],
        };
      },
    });
  },
}));

import { POST } from "./route";

// A digit that appears nowhere else in the fixture, so finding it in the prompt would mean a score leaked.
const SCORE_VALUE = 9;

function seed(db: Db) {
  const dir = mkdtempSync(join(tmpdir(), "search-route-"));
  process.env.DB_PATH = join(dir, "db.json");
  writeFileSync(process.env.DB_PATH, JSON.stringify(db));
}

function scored(): Db {
  const db = makeDb();
  return {
    ...db,
    scores: [{ companyId: "company-01", applicantId: "talent-020", requirementId: "req-01-1", stage: "card", value: SCORE_VALUE }],
  };
}

const post = (body: unknown) =>
  POST(new Request("http://x/api/ai/search-applicants", { method: "POST", body: JSON.stringify(body), headers: { "x-forwarded-for": `ip-${Math.random()}` } }));

beforeEach(() => {
  seed(scored());
  state.role = "recruiter";
  state.prompts = [];
  state.model = "ok";
  // Fixture order is talent-017 (A1), talent-020 (A2).
  state.reply = JSON.stringify({
    interpretation: "Applicants with an example for requirement 1.",
    groups: [{ label: "Example for requirement 1", applicants: [{ id: "A2", reason: 'Wrote "Body of story-020-a".' }, { id: "A9", reason: "x" }] }],
  });
});

describe("POST /api/ai/search-applicants", () => {
  test("searchRoute_validReply_returnsRealIdsAndDropsUnknown", async () => {
    const res = await post({ query: "who has requirement 1?" });
    expect(await res.json()).toEqual({
      source: "model",
      value: {
        interpretation: "Applicants with an example for requirement 1.",
        groups: [{ label: "Example for requirement 1", applicant_ids: ["talent-020"], reason_per_applicant: { "talent-020": 'Wrote "Body of story-020-a".' } }],
      },
    });
  });

  test("searchRoute_promptSent_hasCardTextButNoScoresNamesOrIds", async () => {
    await post({ query: "who has requirement 1?" });
    // Only the data part: the system prompt itself tells the model that scores are off limits.
    const sent = state.prompts.join("\n").split('"role":"user"')[1] ?? "";
    expect(sent).toContain("Body of story-020-a");
    expect(sent).not.toMatch(/score/i);
    expect(sent).not.toContain(String(SCORE_VALUE));
    expect(sent).not.toContain("talent-0");
    expect(sent).not.toContain("Demo Person");
    expect(sent).not.toContain("Applicant 0");
    expect(sent).not.toContain("example.org");
  });

  test("searchRoute_onlySearchesShownList_invitedApplicantLeftOut", async () => {
    const db = scored();
    seed({ ...db, meetings: [{ id: "m1", eventId: "event-01", companyId: "company-01", applicantId: "talent-020", status: "requested" }] });
    await post({ query: "anyone" });
    expect(state.prompts.join("\n")).not.toContain("Body of story-020-a");
    expect(state.prompts.join("\n")).toContain('<card id=\\"A1\\">');
  });

  test("searchRoute_noModel_returnsEmptyMockAndListStaysUsable", async () => {
    state.model = "none";
    expect(await (await post({ query: "x" })).json()).toEqual({ source: "mock", value: { interpretation: "", groups: [] } });
  });

  test("searchRoute_providerThrows_returnsFallbackNotError", async () => {
    state.model = "throws";
    const res = await post({ query: "x" });
    expect(res.status).toBe(200);
    expect((await res.json()).source).toBe("mock-fallback");
  });

  test("searchRoute_malformedReply_returnsFallback", async () => {
    state.reply = "not json";
    expect((await (await post({ query: "x" })).json()).source).toBe("mock-fallback");
  });

  test("searchRoute_notRecruiter_404", async () => {
    state.role = "applicant";
    expect((await post({ query: "x" })).status).toBe(404);
  });

  test("searchRoute_emptyQuery_400", async () => {
    expect((await post({ query: "   " })).status).toBe(400);
  });
});
