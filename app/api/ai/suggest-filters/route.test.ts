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
  const dir = mkdtempSync(join(tmpdir(), "suggest-route-"));
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
  POST(new Request("http://x/api/ai/suggest-filters", { method: "POST", body: JSON.stringify(body), headers: { "x-forwarded-for": `ip-${Math.random()}` } }));

beforeEach(() => {
  seed(scored());
  state.role = "recruiter";
  state.prompts = [];
  state.model = "ok";
  // Fixture order is talent-017 (A1), talent-020 (A2).
  state.reply = JSON.stringify({
    suggested_filters: [
      { label: "Example for requirement 1", description: "Cards with an example for requirement 1.", applicants: [{ id: "A2", reason: 'Wrote "Body of story-020-a".' }, { id: "A9", reason: "x" }] },
      { label: "Everyone", description: "Matches the whole list.", applicants: [{ id: "A1", reason: "a" }, { id: "A2", reason: "b" }] },
    ],
  });
});

describe("POST /api/ai/suggest-filters", () => {
  test("suggestRoute_validReply_realIdsUnknownDroppedAllMatchingSkipped", async () => {
    const res = await post({ refresh: true });
    expect(await res.json()).toEqual({
      source: "model",
      value: [
        {
          id: "suggested-1",
          label: "Example for requirement 1",
          description: "Cards with an example for requirement 1.",
          applicant_ids: ["talent-020"],
          reason_per_applicant: { "talent-020": 'Wrote "Body of story-020-a".' },
        },
      ],
    });
  });

  test("suggestRoute_promptSent_hasCardTextButNoScoresNamesOrIds", async () => {
    await post({ refresh: true });
    const sent = state.prompts.join("\n").split('"role":"user"')[1] ?? "";
    expect(sent).toContain("Body of story-020-a");
    expect(sent).not.toMatch(/score/i);
    expect(sent).not.toContain(String(SCORE_VALUE));
    expect(sent).not.toContain("talent-0");
    expect(sent).not.toContain("Demo Person");
    expect(sent).not.toContain("example.org");
  });

  test("suggestRoute_secondOpen_usesCacheUntilRefresh", async () => {
    await post({ refresh: true });
    await post({});
    expect(state.prompts).toHaveLength(1);
    await post({ refresh: true });
    expect(state.prompts).toHaveLength(2);
  });

  test("suggestRoute_noModel_returnsEmptyMock", async () => {
    state.model = "none";
    expect(await (await post({ refresh: true })).json()).toEqual({ source: "mock", value: [] });
  });

  test("suggestRoute_providerThrows_returnsFallbackNotError", async () => {
    state.model = "throws";
    const res = await post({ refresh: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ source: "mock-fallback", value: [] });
  });

  test("suggestRoute_malformedReply_returnsFallback", async () => {
    state.reply = "{not json";
    expect((await (await post({ refresh: true })).json()).source).toBe("mock-fallback");
  });

  test("suggestRoute_notRecruiter_404", async () => {
    state.role = "applicant";
    expect((await post({ refresh: true })).status).toBe(404);
  });
});
