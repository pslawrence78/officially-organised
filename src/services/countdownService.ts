import type { CountdownDisplay, CountdownSuggestion, CountdownTarget, SchoolCalendar } from "../domain/types";
import { currentDateKey } from "../utils/dates";

function dateKeyAsUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function calculateCountdown(target: CountdownTarget, today = currentDateKey()): CountdownDisplay {
  const daysUntil = Math.round((dateKeyAsUtc(target.targetDate) - dateKeyAsUtc(today)) / 86_400_000);
  const isToday = daysUntil === 0;
  const hasPassed = daysUntil < 0;
  const sleepsUntil = Math.max(0, daysUntil);
  const label = isToday ? `Today: ${target.title}`
    : hasPassed ? `${target.title} has passed`
      : target.showSleeps ? `${sleepsUntil} ${sleepsUntil === 1 ? "sleep" : "sleeps"} until ${target.title}`
        : `${daysUntil} ${daysUntil === 1 ? "day" : "days"} until ${target.title}`;
  return { id: target.id, title: target.title, targetDate: target.targetDate, daysUntil, sleepsUntil, isToday, hasPassed, label, sourceType: target.sourceType, visibility: target.visibility, showSleeps: target.showSleeps };
}

export function dashboardCountdowns(targets: CountdownTarget[], today = currentDateKey()) {
  const visible = targets.filter((target) => target.active && target.visibility !== "hidden").map((target) => calculateCountdown(target, today)).filter((display) => !display.hasPassed);
  const primary = visible.filter((display) => display.visibility === "dashboard_primary").sort((left, right) => left.targetDate.localeCompare(right.targetDate))[0];
  const secondary = visible.filter((display) => display.visibility === "dashboard_secondary").sort((left, right) => left.targetDate.localeCompare(right.targetDate)).slice(0, 3);
  return { primary, secondary };
}

export function schoolCountdownSuggestions(calendar: SchoolCalendar | undefined, today = currentDateKey()): CountdownSuggestion[] {
  if (!calendar) return [];
  const suggestions: CountdownSuggestion[] = [];
  for (const period of calendar.periods) {
    if (period.type === "holiday" && period.startDate >= today) suggestions.push({ id: `suggestion_${period.id}_start`, title: period.label, targetDate: period.startDate, sourceType: "school_period_start", sourceId: `${calendar.id}:${period.id}:start` });
    if (period.type === "term" && period.endDate >= today) suggestions.push({ id: `suggestion_${period.id}_end`, title: `End of ${period.label}`, targetDate: period.endDate, sourceType: "school_period_end", sourceId: `${calendar.id}:${period.id}:end` });
    if (period.type === "term" && period.startDate >= today) suggestions.push({ id: `suggestion_${period.id}_start`, title: `${period.label} begins`, targetDate: period.startDate, sourceType: "school_period_start", sourceId: `${calendar.id}:${period.id}:start` });
  }
  for (const closure of calendar.closureDays) if (closure.date >= today) suggestions.push({ id: `suggestion_${closure.id}`, title: closure.label, targetDate: closure.date, sourceType: "school_closure", sourceId: `${calendar.id}:${closure.id}` });
  return suggestions.sort((left, right) => left.targetDate.localeCompare(right.targetDate));
}

export function countdownTargetFromSuggestion(suggestion: CountdownSuggestion, now = new Date()): CountdownTarget {
  const timestamp = now.toISOString();
  return { ...suggestion, id: `countdown_${suggestion.id}`, visibility: "dashboard_secondary", showSleeps: true, active: true, createdAt: timestamp, updatedAt: timestamp };
}
