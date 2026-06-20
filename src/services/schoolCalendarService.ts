import type { SchoolCalendar, SchoolDayStatus } from "../domain/types";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isWeekend(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

function includesDate(startDate: string, endDate: string, date: string) {
  return startDate <= date && date <= endDate;
}

export function getSchoolDayStatus(calendar: SchoolCalendar | undefined, date: string): SchoolDayStatus {
  if (!DATE_KEY_PATTERN.test(date)) throw new Error("School status requires a YYYY-MM-DD date.");
  if (!calendar) return { date, isSchoolOpen: false, status: "unknown", reason: "no_calendar", label: "School calendar not yet configured" };

  const closure = calendar.closureDays.find((day) => day.date === date);
  if (closure) return { date, isSchoolOpen: false, status: "closed", reason: closure.type, label: closure.label };
  if (isWeekend(date)) return { date, isSchoolOpen: false, status: "closed", reason: "weekend", label: "Weekend" };

  const holiday = calendar.periods.find((period) => period.type === "holiday" && includesDate(period.startDate, period.endDate, date));
  if (holiday) return { date, isSchoolOpen: false, status: "closed", reason: "holiday", label: holiday.label };

  const term = calendar.periods.find((period) => period.type === "term" && includesDate(period.startDate, period.endDate, date));
  if (term) return { date, isSchoolOpen: true, status: "open", reason: "term_weekday", label: term.label };

  return { date, isSchoolOpen: false, status: "unknown", reason: "outside_known_calendar", label: "Outside the configured school calendar" };
}
