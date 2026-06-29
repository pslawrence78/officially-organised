import { describe, expect, it } from "vitest";
import type { HouseholdAdminItem } from "../domain/types";
import { addMonthsClamped, calculateNextHouseholdAdminDueDate, deriveHouseholdAdminSignal } from "./householdAdminService";

function item(overrides: Partial<HouseholdAdminItem> = {}): HouseholdAdminItem {
  return {
    id: "household_admin_test",
    title: "Boiler service",
    category: "home_maintenance",
    adminType: "boiler_service",
    status: "active",
    dueDate: "2026-07-01",
    renewalCycle: "annual",
    reminderDaysBefore: [30, 14, 7],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("household admin service", () => {
  it("derives overdue, due today, due soon, upcoming, no date and archived states", () => {
    expect(deriveHouseholdAdminSignal(item({ dueDate: "2026-06-01" }), "2026-06-29").dueState).toBe("overdue");
    expect(deriveHouseholdAdminSignal(item({ dueDate: "2026-06-29" }), "2026-06-29").dueState).toBe("due_today");
    expect(deriveHouseholdAdminSignal(item({ dueDate: "2026-07-10" }), "2026-06-29").dueState).toBe("due_soon");
    expect(deriveHouseholdAdminSignal(item({ dueDate: "2026-09-10" }), "2026-06-29").dueState).toBe("upcoming");
    expect(deriveHouseholdAdminSignal(item({ dueDate: undefined }), "2026-06-29").dueState).toBe("no_date");
    expect(deriveHouseholdAdminSignal(item({ status: "archived", archivedAt: "2026-06-29T12:00:00.000Z" }), "2026-06-29").dueState).toBe("archived");
  });

  it("calculates next due dates for annual, six-monthly and custom cycles", () => {
    expect(calculateNextHouseholdAdminDueDate(item({ renewalCycle: "annual" }), "2026-07-01")).toBe("2027-07-01");
    expect(calculateNextHouseholdAdminDueDate(item({ renewalCycle: "six_monthly" }), "2026-07-01")).toBe("2027-01-01");
    expect(calculateNextHouseholdAdminDueDate(item({ renewalCycle: "custom", customCycleMonths: 5 }), "2026-07-01")).toBe("2026-12-01");
  });

  it("keeps month-end and leap-year calculations stable", () => {
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsClamped("2024-02-29", 12)).toBe("2025-02-28");
  });
});
