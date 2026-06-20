import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import { getSchoolCalendar, saveSchoolCalendar } from "./schoolCalendarRepository";

describe("school calendar repository", () => {
  beforeEach(async () => { await db.delete(); await db.open(); });
  afterEach(async () => { await db.delete(); });

  it("seeds one clearly illustrative Seb calendar without duplication", async () => {
    await seedInitialDataIfNeeded();
    await seedInitialDataIfNeeded();
    expect(await db.schoolCalendars.count()).toBe(1);
    expect(await getSchoolCalendar()).toMatchObject({ childMemberId: "member_seb", schoolName: "Illustrative Primary School", academicYearLabel: "2025/26" });
  });

  it("saves local calendar edits", async () => {
    await seedInitialDataIfNeeded();
    const calendar = (await getSchoolCalendar())!;
    await saveSchoolCalendar({ ...calendar, closureDays: [...calendar.closureDays, { id: "closure_test", date: "2026-07-01", type: "other_closed", label: "Illustrative local closure" }] });
    expect((await getSchoolCalendar())?.closureDays).toContainEqual(expect.objectContaining({ id: "closure_test" }));
  });
});
