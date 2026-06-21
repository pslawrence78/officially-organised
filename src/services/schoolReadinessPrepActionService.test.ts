import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import type { SchoolReadinessForDate } from "../domain/types";
import { deriveSchoolReadinessPrepCandidates, upsertSchoolReadinessPrepActionsForRange } from "./schoolReadinessPrepActionService";

const readiness = (values: Partial<SchoolReadinessForDate> = {}): SchoolReadinessForDate => ({
  date: "2026-09-14", schoolStatus: "open", schoolStatusLabel: "School open", hasConfiguration: true,
  lunch: { type: "school_dinner", label: "School dinner", choice: "Pasta", isKnown: true },
  attire: { type: "school_uniform", label: "School uniform", isKnown: true },
  forestSchool: { required: false, wellingtonBoots: false, longTrousers: false }, readinessItems: [], ...values,
});

afterEach(async () => { await db.schoolReadinessPrepActions.clear(); await db.auditLog.clear(); });

describe("school readiness prep action service", () => {
  it("creates packed lunch, PE and Forest School actions without dinner noise", () => {
    const values = deriveSchoolReadinessPrepCandidates(readiness({ lunch: { type: "packed_lunch", label: "Packed lunch", isKnown: true }, attire: { type: "pe_kit", label: "PE kit", isKnown: true }, forestSchool: { required: true, wellingtonBoots: true, longTrousers: true } }));
    expect(values.map((item) => item.title)).toEqual(expect.arrayContaining(["Prepare packed lunch", "Pack PE kit", "Put Forest School wellies ready", "Prepare long trousers for Forest School"]));
    expect(deriveSchoolReadinessPrepCandidates(readiness())).toHaveLength(0);
  });

  it("creates check actions for unknown requirements and none for a closed day", () => {
    const values = deriveSchoolReadinessPrepCandidates(readiness({ hasConfiguration: false, lunch: { type: "unknown", label: "Unknown", isKnown: false }, attire: { type: "unknown", label: "Unknown", isKnown: false } }));
    expect(values.filter((item) => item.category === "check_required")).toHaveLength(2);
    expect(deriveSchoolReadinessPrepCandidates(readiness({ schoolStatus: "closed" }))).toEqual([]);
  });

  it("materialises idempotently and preserves completed intent", async () => {
    const day = readiness({ lunch: { type: "packed_lunch", label: "Packed lunch", isKnown: true } });
    await upsertSchoolReadinessPrepActionsForRange([day]);
    await upsertSchoolReadinessPrepActionsForRange([day]);
    const [action] = await db.schoolReadinessPrepActions.toArray();
    expect(await db.schoolReadinessPrepActions.count()).toBe(1);
    await db.schoolReadinessPrepActions.update(action.id, { status: "done" });
    await upsertSchoolReadinessPrepActionsForRange([day]);
    expect((await db.schoolReadinessPrepActions.get(action.id))?.status).toBe("done");
  });

  it("stales obsolete open and weather actions", async () => {
    const day = readiness({ lunch: { type: "packed_lunch", label: "Packed lunch", isKnown: true } });
    await upsertSchoolReadinessPrepActionsForRange([day], { [day.date]: [{ id: "rain-v1", date: day.date, title: "Take a waterproof coat", detail: "Rain", severity: "important", category: "rain", appliesTo: "school_day", source: "weather" }] });
    await upsertSchoolReadinessPrepActionsForRange([readiness()]);
    const values = await db.schoolReadinessPrepActions.toArray();
    expect(values.filter((item) => item.status === "stale")).toHaveLength(2);
  });
});
