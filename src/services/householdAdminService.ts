import {
  HOUSEHOLD_ADMIN_TYPE_LABELS,
} from "../domain/constants";
import type {
  HouseholdAdminCycle,
  HouseholdAdminItem,
  HouseholdAdminStatus,
  HouseholdAdminType,
} from "../domain/types";
import { currentDateKey } from "../utils/dates";

export type HouseholdAdminDueState =
  | "overdue"
  | "due_today"
  | "due_soon"
  | "upcoming"
  | "no_date"
  | "complete"
  | "archived";

export interface HouseholdAdminSignal {
  item: HouseholdAdminItem;
  dueState: HouseholdAdminDueState;
  severity: "critical" | "warning" | "info" | "calm";
  daysUntilDue?: number;
  label: string;
  message: string;
  suggestedAction: string;
}

const CRITICAL_TYPES = new Set<HouseholdAdminType>([
  "mot",
  "car_insurance",
  "home_insurance",
  "breakdown_cover",
  "boiler_service",
  "car_service",
]);

function reminderWindow(item: HouseholdAdminItem) {
  const values = (item.reminderDaysBefore ?? []).filter((value) => Number.isInteger(value) && value >= 0);
  if (!values.length) return 30;
  return Math.max(...values);
}

function diffDays(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

export function addMonthsClamped(dateKey: string, months: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const monthIndex = month - 1 + months;
  const nextYear = year + Math.floor(monthIndex / 12);
  const nextMonthIndex = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(nextYear, nextMonthIndex + 1, 0)).getUTCDate();
  const nextDay = Math.min(day, lastDay);
  return `${nextYear.toString().padStart(4, "0")}-${String(nextMonthIndex + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
}

export function cycleMonths(cycle: HouseholdAdminCycle, customCycleMonths?: number) {
  switch (cycle) {
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "six_monthly":
      return 6;
    case "annual":
      return 12;
    case "two_yearly":
      return 24;
    case "custom":
      return customCycleMonths ?? 0;
    default:
      return 0;
  }
}

export function calculateNextHouseholdAdminDueDate(item: HouseholdAdminItem, completionDate: string) {
  const months = cycleMonths(item.renewalCycle, item.customCycleMonths);
  return months > 0 ? addMonthsClamped(completionDate, months) : item.dueDate;
}

function dueStateLabel(state: HouseholdAdminDueState, daysUntilDue?: number) {
  switch (state) {
    case "overdue":
      return "Overdue";
    case "due_today":
      return "Due today";
    case "due_soon":
      return daysUntilDue === 1 ? "Due in 1 day" : `Due in ${daysUntilDue ?? 0} days`;
    case "upcoming":
      return daysUntilDue === 1 ? "Due in 1 day" : `Due in ${daysUntilDue ?? 0} days`;
    case "no_date":
      return "No due date";
    case "complete":
      return "Complete";
    case "archived":
      return "Archived";
  }
}

function suggestedAction(item: HouseholdAdminItem, dueState: HouseholdAdminDueState) {
  if (dueState === "no_date") return "Add due date";
  if (item.adminType === "car_service" || item.adminType === "mot" || item.adminType === "boiler_service" || item.adminType === "aircon_service" || item.adminType === "appliance_service" || item.adminType === "home_maintenance") {
    return dueState === "complete" ? "Confirm whether still needed" : dueState === "archived" ? "Review archived item" : "Book service";
  }
  if (item.adminType === "warranty_expiry" || item.adminType === "subscription_renewal") return dueState === "complete" ? "Confirm whether still needed" : "Review renewal";
  return "Check cover";
}

export function deriveHouseholdAdminSignal(item: HouseholdAdminItem, today = currentDateKey()): HouseholdAdminSignal {
  let dueState: HouseholdAdminDueState;
  let daysUntilDue: number | undefined;

  if (item.status === "archived" || item.archivedAt) dueState = "archived";
  else if (["completed", "renewed", "not_needed"].includes(item.status) && (!item.dueDate || item.dueDate <= today)) dueState = "complete";
  else if (!item.dueDate) dueState = "no_date";
  else {
    daysUntilDue = diffDays(today, item.dueDate);
    if (daysUntilDue < 0) dueState = "overdue";
    else if (daysUntilDue === 0) dueState = "due_today";
    else if (daysUntilDue <= reminderWindow(item)) dueState = "due_soon";
    else dueState = "upcoming";
  }

  const severity =
    dueState === "overdue" ? (CRITICAL_TYPES.has(item.adminType) ? "critical" : "warning")
      : dueState === "due_today" ? (CRITICAL_TYPES.has(item.adminType) ? "critical" : "warning")
        : dueState === "due_soon" ? "warning"
          : dueState === "no_date" ? "info"
            : "calm";

  const typeLabel = HOUSEHOLD_ADMIN_TYPE_LABELS[item.adminType].toLowerCase();
  const message =
    dueState === "overdue" ? `${HOUSEHOLD_ADMIN_TYPE_LABELS[item.adminType]} overdue`
      : dueState === "due_today" ? `${HOUSEHOLD_ADMIN_TYPE_LABELS[item.adminType]} due today`
        : dueState === "due_soon" ? `${HOUSEHOLD_ADMIN_TYPE_LABELS[item.adminType]} due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`
          : dueState === "upcoming" ? `${HOUSEHOLD_ADMIN_TYPE_LABELS[item.adminType]} coming up`
            : dueState === "no_date" ? `${HOUSEHOLD_ADMIN_TYPE_LABELS[item.adminType]} has no due date`
              : dueState === "archived" ? `${HOUSEHOLD_ADMIN_TYPE_LABELS[item.adminType]} archived`
                : `${HOUSEHOLD_ADMIN_TYPE_LABELS[item.adminType]} complete`;

  return {
    item,
    dueState,
    severity,
    daysUntilDue,
    label: dueStateLabel(dueState, daysUntilDue),
    message,
    suggestedAction: suggestedAction(item, dueState),
  };
}

export function completeHouseholdAdminItem(
  item: HouseholdAdminItem,
  nextStatus: Extract<HouseholdAdminStatus, "booked" | "completed" | "renewed" | "archived">,
  completionDate = currentDateKey(),
  notes?: string,
) {
  const now = new Date().toISOString();
  if (nextStatus === "booked") {
    return {
      ...item,
      status: "booked" as const,
      notes: notes?.trim() || item.notes,
      updatedAt: now,
    };
  }

  if (nextStatus === "archived") {
    return {
      ...item,
      status: "archived" as const,
      archivedAt: now,
      updatedAt: now,
    };
  }

  return {
    ...item,
    status: nextStatus,
    lastCompletedDate: completionDate,
    dueDate: calculateNextHouseholdAdminDueDate(item, completionDate),
    notes: notes?.trim() || item.notes,
    archivedAt: undefined,
    updatedAt: now,
  };
}

export function sortHouseholdAdminSignals(items: HouseholdAdminSignal[]) {
  const order: Record<HouseholdAdminDueState, number> = {
    overdue: 0,
    due_today: 1,
    due_soon: 2,
    no_date: 3,
    upcoming: 4,
    complete: 5,
    archived: 6,
  };
  return [...items].sort((left, right) =>
    order[left.dueState] - order[right.dueState]
      || (left.daysUntilDue ?? 9999) - (right.daysUntilDue ?? 9999)
      || left.item.title.localeCompare(right.item.title),
  );
}
