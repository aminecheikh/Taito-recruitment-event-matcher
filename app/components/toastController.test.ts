import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TOAST_MS, createToastController, type Toast } from "./toastController";

describe("toast controller", () => {
  let shown: (Toast | null)[];
  beforeEach(() => {
    vi.useFakeTimers();
    shown = [];
  });
  afterEach(() => vi.useRealTimers());

  const current = () => shown.at(-1) ?? null;

  test("toast_afterTimeout_dismissesItself", () => {
    const toast = createToastController((t) => shown.push(t));
    toast.show("Marked 1 applicant for later.");
    expect(current()?.text).toBe("Marked 1 applicant for later.");
    vi.advanceTimersByTime(TOAST_MS - 1);
    expect(current()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(current()).toBeNull();
  });

  test("toast_shownTwiceQuickly_replacesInsteadOfStacking", () => {
    const toast = createToastController((t) => shown.push(t));
    toast.show("Marked 1 applicant for later.");
    vi.advanceTimersByTime(TOAST_MS - 100);
    toast.show("Unmarked 2 applicants.");
    // Only ever one toast: the latest. Its timer restarted, so it is still there after the first one's time.
    expect(current()?.text).toBe("Unmarked 2 applicants.");
    vi.advanceTimersByTime(200);
    expect(current()?.text).toBe("Unmarked 2 applicants.");
    vi.advanceTimersByTime(TOAST_MS);
    expect(current()).toBeNull();
    expect(shown.filter((t) => t === null)).toHaveLength(1);
  });

  test("toast_closedEarly_goesAndTimerDoesNothingLater", () => {
    const toast = createToastController((t) => shown.push(t));
    toast.show("Marked 1 applicant for later.");
    toast.dismiss();
    expect(current()).toBeNull();
    const calls = shown.length;
    vi.advanceTimersByTime(TOAST_MS * 2);
    expect(shown).toHaveLength(calls);
  });
});
