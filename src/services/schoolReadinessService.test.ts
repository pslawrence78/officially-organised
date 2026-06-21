import { describe, expect, it } from "vitest";
import type { SchoolCalendar, SchoolHalfTermConfig } from "../domain/types";
import { getSchoolReadinessForDate, validateSchoolHalfTermConfig } from "./schoolReadinessService";

const calendar: SchoolCalendar = { id: "cal", childMemberId: "member_seb", schoolName: "Test", academicYearLabel: "2026", timezone: "Europe/London", periods: [{ id: "term", label: "Term", type: "term", startDate: "2026-06-01", endDate: "2026-06-30" }], closureDays: [{ id: "closed", date: "2026-06-12", type: "inset", label: "INSET" }], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
const config: SchoolHalfTermConfig = { id: "half", schoolCalendarId: "cal", label: "Summer 2", startDate: "2026-06-01", endDate: "2026-06-30", entries: [{ id: "day", schoolCalendarId: "cal", halfTermConfigId: "half", date: "2026-06-10", lunchType: "school_dinner", lunchChoice: "Pasta", attireType: "pe_kit", forestSchool: { required: true, wellingtonBoots: true, longTrousers: true }, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" }], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };

describe("school readiness", () => {
  it("returns configured lunch, attire and Forest School kit", () => { const value = getSchoolReadinessForDate(calendar, [config], "2026-06-10"); expect(value.lunch.choice).toBe("Pasta"); expect(value.attire.type).toBe("pe_kit"); expect(value.forestSchool.wellingtonBoots).toBe(true); });
  it("warns for an open unconfigured day", () => { expect(getSchoolReadinessForDate(calendar, [config], "2026-06-11").readinessItems[0]?.label).toMatch(/not configured/); });
  it("suppresses requirement warnings when school is closed", () => { expect(getSchoolReadinessForDate(calendar, [], "2026-06-12").readinessItems).toEqual([]); });
  it("blocks overlapping configurations", () => { expect(validateSchoolHalfTermConfig({ ...config, id: "other" }, [config]).valid).toBe(false); });
});
