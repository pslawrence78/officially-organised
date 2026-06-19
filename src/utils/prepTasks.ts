import type { PrepTask, PrepTaskWithEvent } from "../domain/types";
import { addDaysToDateKey, currentDateKey, getWeekStartDateKey, isoToDateKey } from "./dates";
import { HOUSEHOLD_TIME_ZONE } from "../domain/constants";

export type PrepTaskGroup = "overdue" | "today" | "tomorrow" | "thisWeek" | "later" | "noDueDate" | "cleared";

export const PREP_GROUP_LABELS: Record<PrepTaskGroup, string> = {
  overdue: "Overdue",
  today: "Due today",
  tomorrow: "Due tomorrow",
  thisWeek: "Due this week",
  later: "Later",
  noDueDate: "No due date",
  cleared: "Done or skipped",
};

export const PREP_GROUP_ORDER: PrepTaskGroup[] = ["overdue", "today", "tomorrow", "thisWeek", "later", "noDueDate", "cleared"];

export function isPrepTaskOverdue(task: PrepTask, now = new Date()) {
  return task.status === "open" && Boolean(task.dueAt) && Date.parse(task.dueAt!) < now.getTime();
}

export function prepTaskGroup(task: PrepTask, now = new Date()): PrepTaskGroup {
  if (task.status !== "open") return "cleared";
  if (!task.dueAt) return "noDueDate";
  if (isPrepTaskOverdue(task, now)) return "overdue";

  const today = currentDateKey(now);
  const dueDate = isoToDateKey(task.dueAt);
  if (dueDate === today) return "today";
  if (dueDate === addDaysToDateKey(today, 1)) return "tomorrow";
  const weekEnd = addDaysToDateKey(getWeekStartDateKey(today), 6);
  if (dueDate <= weekEnd) return "thisWeek";
  return "later";
}

export function formatPrepDue(dueAt?: string) {
  if (!dueAt) return "No due date";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: HOUSEHOLD_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(dueAt));
}

export function prepSummary(items: PrepTaskWithEvent[], now = new Date()) {
  const open = items.filter(({ task }) => task.status === "open");
  return {
    open: open.length,
    overdue: open.filter(({ task }) => isPrepTaskOverdue(task, now)).length,
    critical: open.filter(({ task }) => task.priority === "critical").length,
    blocking: open.filter(({ task }) => task.blocksEvent).length,
  };
}
