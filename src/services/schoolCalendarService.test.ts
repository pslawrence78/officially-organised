import { describe, expect, it } from "vitest";
import type { SchoolCalendar } from "../domain/types";
import { getSchoolDayStatus } from "./schoolCalendarService";

const calendar: SchoolCalendar = {
  id: "school_test", childMemberId: "member_seb", schoolName: "Illustrative School", academicYearLabel: "2026/27", timezone: "Europe/London",
  periods: [
    { id: "term", label: "Illustrative Autumn Term", type: "term", startDate: "2026-09-01", endDate: "2026-12-18" },
    { id: "holiday", label: "Illustrative October Half Term", type: "holiday", startDate: "2026-10-26", endDate: "2026-10-30" },
  ],
  closureDays: [
    { id: "inset", date: "2026-09-18", type: "inset", label: "Illustrative INSET Day" },
    { id: "other", date: "2026-09-21", type: "other_closed", label: "Illustrative closure" },
  ],
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("school calendar status", () => {
  it("opens on a weekday inside term", () => expect(getSchoolDayStatus(calendar, "2026-09-16")).toMatchObject({ status: "open", isSchoolOpen: true, reason: "term_weekday" }));
  it.each(["2026-09-12", "2026-09-13"])("closes on weekend %s inside term", (date) => expect(getSchoolDayStatus(calendar, date)).toMatchObject({ status: "closed", reason: "weekend" }));
  it("closes for a holiday period", () => expect(getSchoolDayStatus(calendar, "2026-10-27")).toMatchObject({ status: "closed", reason: "holiday", label: "Illustrative October Half Term" }));
  it("closes for an INSET day inside term", () => expect(getSchoolDayStatus(calendar, "2026-09-18")).toMatchObject({ status: "closed", reason: "inset" }));
  it("lets another closure override a normal term weekday", () => expect(getSchoolDayStatus(calendar, "2026-09-21")).toMatchObject({ status: "closed", reason: "other_closed" }));
  it("returns unknown outside the configured calendar", () => expect(getSchoolDayStatus(calendar, "2027-02-01")).toMatchObject({ status: "unknown", reason: "outside_known_calendar" }));
  it("returns a safe status without a calendar", () => expect(getSchoolDayStatus(undefined, "2026-09-16")).toMatchObject({ status: "unknown", reason: "no_calendar", isSchoolOpen: false }));
});
