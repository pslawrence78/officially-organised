import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import { getCountdownTarget, getCountdownTargets, saveCountdownTarget } from "./countdownRepository";

describe("countdown repository", () => {
  beforeEach(async () => { await db.delete(); await db.open(); });
  afterEach(async () => { await db.delete(); });

  it("seeds illustrative countdowns once", async () => {
    await seedInitialDataIfNeeded(); await seedInitialDataIfNeeded();
    expect(await getCountdownTargets()).toHaveLength(2);
    expect(await getCountdownTarget("countdown_illustrative_summer_holiday")).toMatchObject({ title: "Illustrative Summer Holiday", visibility: "dashboard_primary" });
  });

  it("saves a trimmed local countdown", async () => {
    const saved = await saveCountdownTarget({ id: "countdown_test", title: "  Family day  ", targetDate: "2026-08-01", sourceType: "manual", visibility: "dashboard_secondary", showSleeps: false, active: true, createdAt: "", updatedAt: "" });
    expect(saved.title).toBe("Family day");
    expect(await getCountdownTarget("countdown_test")).toMatchObject({ title: "Family day", showSleeps: false });
  });
});
