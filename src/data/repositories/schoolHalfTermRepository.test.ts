import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { getSchoolHalfTermConfigForDate, listSchoolHalfTermConfigsForCalendar, saveSchoolHalfTermConfig } from "./schoolHalfTermRepository";

afterEach(() => db.schoolHalfTermConfigs.clear());

describe("school half-term repository", () => {
  it("saves and finds a configuration by school date", async () => {
    await saveSchoolHalfTermConfig({ id: "half", schoolCalendarId: "cal", label: "Autumn 1", startDate: "2026-09-01", endDate: "2026-10-23", entries: [], createdAt: "", updatedAt: "" });
    expect((await listSchoolHalfTermConfigsForCalendar("cal"))).toHaveLength(1);
    expect((await getSchoolHalfTermConfigForDate("cal", "2026-09-14"))?.label).toBe("Autumn 1");
  });
});
