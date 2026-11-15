import { describe, expect, test } from "vitest";
import { keepShown, markedAmong, summarise, toggleAll, toggleOne } from "./selection";

const SHOWN = ["a", "b", "c"];

describe("selection", () => {
  test("toggleOne_tickAndUntick_individual", () => {
    const one = toggleOne(new Set(), "b", true);
    expect([...one]).toEqual(["b"]);
    expect([...toggleOne(one, "b", false)]).toEqual([]);
  });

  test("toggleAll_on_selectsEveryShown", () => {
    const all = toggleAll(SHOWN, true);
    expect(summarise(all, SHOWN)).toEqual({ count: 3, total: 3, all: true, some: false });
  });

  test("toggleOne_untickAfterSelectAll_leavesTheRest", () => {
    const rest = toggleOne(toggleAll(SHOWN, true), "a", false);
    expect([...rest].sort()).toEqual(["b", "c"]);
    expect(summarise(rest, SHOWN)).toEqual({ count: 2, total: 3, all: false, some: true });
  });

  test("toggleAll_off_clears", () => expect(toggleAll(SHOWN, false).size).toBe(0));

  test("keepShown_applicantLeftList_droppedFromSelection", () =>
    expect([...keepShown(new Set(["a", "c"]), ["c"])]).toEqual(["c"]));

  test("summarise_applicantInTwoGroups_countedOnce", () =>
    expect(summarise(new Set(["a"]), ["a", "a", "b"])).toEqual({ count: 1, total: 2, all: false, some: true }));

  test("summarise_emptyList_notAll", () => expect(summarise(new Set(), [])).toMatchObject({ all: false, count: 0 }));
});

describe("markedAmong", () => {
  const marked = new Set(["b"]);
  test("markedAmong_noneSelectedMarked_returnsEmpty", () => {
    expect(markedAmong(new Set(["a", "c"]), (id) => marked.has(id))).toEqual([]);
  });
  test("markedAmong_someSelectedMarked_returnsOnlyThose", () => {
    expect(markedAmong(new Set(["a", "b"]), (id) => marked.has(id))).toEqual(["b"]);
  });
});
