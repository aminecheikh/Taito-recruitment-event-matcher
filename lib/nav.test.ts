import { describe, expect, test } from "vitest";
import { currentNavHref, ROLE_NAV } from "./nav";

describe("currentNavHref", () => {
  test("currentNavHref_nestedStaffPage_picksOnlyTheLongestMatch", () => {
    expect(currentNavHref(ROLE_NAV.staff, "/staff/insights")).toBe("/staff/insights");
  });
  test("currentNavHref_staffHome_picksStaff", () => {
    expect(currentNavHref(ROLE_NAV.staff, "/staff")).toBe("/staff");
  });
  test("currentNavHref_detailPage_picksItsSection", () => {
    expect(currentNavHref(ROLE_NAV.applicant, "/applicant/meetings/meeting-1")).toBe("/applicant/meetings");
  });
  test("currentNavHref_similarPrefix_doesNotMatch", () => {
    expect(currentNavHref([{ label: "Staff", href: "/staff" }], "/staffroom")).toBeUndefined();
  });
  test("currentNavHref_unrelatedPage_returnsUndefined", () => {
    expect(currentNavHref(ROLE_NAV.staff, "/privacy")).toBeUndefined();
  });
});
