import { describe, expect, it } from "vitest";
import type { CountdownTarget, SchoolCalendar } from "../domain/types";
import { calculateCountdown, dashboardCountdowns, schoolCountdownSuggestions } from "./countdownService";

function target(id: string, date: string, visibility: CountdownTarget["visibility"] = "dashboard_secondary", active = true): CountdownTarget {
  return { id, title: id, targetDate: date, sourceType: "manual", visibility, showSleeps: true, active, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}

describe("countdown calculations", () => {
  it("returns zero days and sleeps today", () => expect(calculateCountdown(target("Today", "2026-06-20"), "2026-06-20")).toMatchObject({ daysUntil: 0, sleepsUntil: 0, isToday: true, hasPassed: false }));
  it("returns one day and sleep tomorrow", () => expect(calculateCountdown(target("Tomorrow", "2026-06-21"), "2026-06-20")).toMatchObject({ daysUntil: 1, sleepsUntil: 1 }));
  it("counts future calendar days without time-of-day", () => expect(calculateCountdown(target("Holiday", "2026-07-04"), "2026-06-20")).toMatchObject({ daysUntil: 14, sleepsUntil: 14 }));
  it("flags and excludes passed targets", () => { const past = target("Past", "2026-06-19"); expect(calculateCountdown(past, "2026-06-20").hasPassed).toBe(true); expect(dashboardCountdowns([past], "2026-06-20").secondary).toEqual([]); });
  it("excludes inactive and hidden targets", () => { const result = dashboardCountdowns([target("Inactive", "2026-06-21", "dashboard_secondary", false), target("Hidden", "2026-06-22", "hidden")], "2026-06-20"); expect(result).toEqual({ primary: undefined, secondary: [] }); });
  it("places primary before date-sorted secondary targets", () => { const result = dashboardCountdowns([target("Later", "2026-07-10"), target("Primary", "2026-08-01", "dashboard_primary"), target("Sooner", "2026-07-01")], "2026-06-20"); expect(result.primary?.id).toBe("Primary"); expect(result.secondary.map(({ id }) => id)).toEqual(["Sooner", "Later"]); });
  it("derives a future school-calendar candidate", () => { const calendar = { periods: [{ id: "holiday", label: "Illustrative Break", type: "holiday", startDate: "2026-07-20", endDate: "2026-07-31" }], closureDays: [], id: "school", childMemberId: "member_seb", schoolName: "Illustrative", academicYearLabel: "2025/26", timezone: "Europe/London", createdAt: "", updatedAt: "" } satisfies SchoolCalendar; expect(schoolCountdownSuggestions(calendar, "2026-06-20")).toContainEqual(expect.objectContaining({ title: "Illustrative Break", targetDate: "2026-07-20", sourceType: "school_period_start" })); });
});
