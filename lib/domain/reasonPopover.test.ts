import { describe, expect, test } from "vitest";
import { CLOSED, popoverReducer as reduce } from "./reasonPopover";

describe("reason popover", () => {
  test("hover_thenLeave_opensAndCloses", () => {
    const open = reduce(CLOSED, { type: "hover", key: "a" });
    expect(open).toEqual({ key: "a", pinned: false });
    expect(reduce(open, { type: "leave", key: "a" })).toEqual(CLOSED);
  });

  test("click_pinsOpen_leaveDoesNotClose_secondClickCloses", () => {
    const pinned = reduce(CLOSED, { type: "toggle", key: "a" });
    expect(reduce(pinned, { type: "leave", key: "a" })).toEqual(pinned);
    expect(reduce(pinned, { type: "toggle", key: "a" })).toEqual(CLOSED);
  });

  test("hoverThenClick_staysOpenPinned", () => {
    const hovered = reduce(CLOSED, { type: "hover", key: "a" });
    expect(reduce(hovered, { type: "toggle", key: "a" })).toEqual({ key: "a", pinned: true });
  });

  test("onlyOneOpen_clickingAnotherMovesIt", () => {
    const a = reduce(CLOSED, { type: "toggle", key: "a" });
    expect(reduce(a, { type: "toggle", key: "b" })).toEqual({ key: "b", pinned: true });
    expect(reduce(a, { type: "hover", key: "b" })).toEqual(a);
  });

  test("escOrOutsideClick_closes", () => {
    expect(reduce(reduce(CLOSED, { type: "toggle", key: "a" }), { type: "close" })).toEqual(CLOSED);
  });
});
