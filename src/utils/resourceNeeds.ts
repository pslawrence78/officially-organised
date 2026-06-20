import { FAMILY_CAR_RESOURCE_ID, HOUSEHOLD_TIME_ZONE } from "../domain/constants";
import type { ResourceNeed, ResourceNeedWithEvent } from "../domain/types";
import { addDaysToDateKey, currentDateKey, dateKeyToIsoStart, getWeekStartDateKey } from "./dates";

export type CarNeedGroup = "today" | "tomorrow" | "thisWeek" | "later";
export const CAR_GROUP_ORDER: CarNeedGroup[] = ["today", "tomorrow", "thisWeek", "later"];
export const CAR_GROUP_LABELS: Record<CarNeedGroup, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  thisWeek: "This week",
  later: "Later",
};

export function isActiveCarNeed(need: ResourceNeed) {
  return need.resourceId === FAMILY_CAR_RESOURCE_ID && (need.needStatus === "required" || need.needStatus === "maybe");
}

export function formatResourceWindow(need: ResourceNeed) {
  if (!need.neededFrom || !need.neededUntil) return "Window not set";
  const dateFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: HOUSEHOLD_TIME_ZONE, weekday: "short", day: "numeric", month: "short" });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: HOUSEHOLD_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const start = new Date(need.neededFrom);
  const end = new Date(need.neededUntil);
  const sameDay = dateFormatter.format(start) === dateFormatter.format(end);
  return sameDay
    ? `${dateFormatter.format(start)}, ${timeFormatter.format(start)}–${timeFormatter.format(end)}`
    : `${dateFormatter.format(start)} ${timeFormatter.format(start)} – ${dateFormatter.format(end)} ${timeFormatter.format(end)}`;
}

export function carNeedGroup(need: ResourceNeed, now = new Date()): CarNeedGroup {
  const today = currentDateKey(now);
  const todayStart = Date.parse(dateKeyToIsoStart(today));
  const tomorrow = addDaysToDateKey(today, 1);
  const tomorrowStart = Date.parse(dateKeyToIsoStart(tomorrow));
  const dayAfterTomorrowStart = Date.parse(dateKeyToIsoStart(addDaysToDateKey(today, 2)));
  const from = Date.parse(need.neededFrom ?? "");
  const until = Date.parse(need.neededUntil ?? "");
  if (from < tomorrowStart && until > todayStart) return "today";
  if (from < dayAfterTomorrowStart && until > tomorrowStart) return "tomorrow";
  const weekEnd = Date.parse(dateKeyToIsoStart(addDaysToDateKey(getWeekStartDateKey(today), 7)));
  if (from < weekEnd) return "thisWeek";
  return "later";
}

export function carSummary(items: ResourceNeedWithEvent[], now = new Date()) {
  const active = items.filter(({ need }) => isActiveCarNeed(need) && Date.parse(need.neededUntil ?? "") >= now.getTime());
  return {
    active,
    required: active.filter(({ need }) => need.needStatus === "required").length,
    maybe: active.filter(({ need }) => need.needStatus === "maybe").length,
    today: active.filter(({ need }) => carNeedGroup(need, now) === "today").length,
  };
}
