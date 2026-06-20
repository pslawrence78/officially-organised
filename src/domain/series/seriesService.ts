import type { EventOccurrence, EventSeries, FamilyEvent, SchoolCalendar, Weekday } from "../types";
import { addDaysToDateKey, localDateTimeToIso } from "../../utils/dates";
import { getSchoolDayStatus } from "../../services/schoolCalendarService";

const WEEKDAYS: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export interface SeriesExpansionOptions { schoolCalendar?: SchoolCalendar; materialisedEvents?: FamilyEvent[]; }

export function occurrenceId(seriesId: string, date: string) { return `occurrence_${seriesId}_${date}`; }
function dayIndex(date: string) { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
function daysBetween(start: string, end: string) { return Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86_400_000); }

function matchesRule(series: EventSeries, date: string) {
  const rule = series.recurrence;
  if (date < rule.startDate || (rule.endDate && date > rule.endDate)) return false;
  if (rule.frequency === "monthly") return Number(date.slice(8)) === (rule.dayOfMonth ?? Number(rule.startDate.slice(8)));
  const configuredDay = WEEKDAYS.indexOf(rule.dayOfWeek!);
  if (dayIndex(date) !== configuredDay) return false;
  if (rule.frequency === "weekly") return true;
  const first = addDaysToDateKey(rule.startDate, (configuredDay - dayIndex(rule.startDate) + 7) % 7);
  const difference = daysBetween(first, date);
  return difference >= 0 && difference % 14 === 0;
}

function buildOccurrence(series: EventSeries, originalDate: string): EventOccurrence {
  const exception = series.exceptions.find((item) => item.occurrenceDate === originalDate);
  const date = exception?.movedToDate ?? originalDate;
  const time = exception?.movedToStartTime ?? series.recurrence.startTime;
  const duration = exception?.movedToDurationMinutes ?? series.recurrence.durationMinutes;
  const startAt = localDateTimeToIso(`${date}T${time}`);
  const endAt = new Date(Date.parse(startAt) + duration * 60_000).toISOString();
  const timestamp = exception?.updatedAt ?? series.updatedAt;
  const prepTasks = exception?.prepTasks ?? series.defaultPrepTasks.map((task) => ({
    id: `prep_${series.id}_${originalDate}_${task.id}`, title: task.title, ownerIds: [...task.ownerIds],
    dueAt: new Date(Date.parse(startAt) + task.dueOffsetMinutes * 60_000).toISOString(), priority: task.priority,
    status: "open" as const, blocksEvent: task.blocksEvent, notes: task.notes, createdAt: timestamp, updatedAt: timestamp,
  }));
  const resourceNeeds = exception?.resourceNeeds ?? series.defaultResourceNeeds.map((need) => ({
    id: `need_${series.id}_${originalDate}_${need.id}`, resourceId: need.resourceId, needStatus: need.needStatus,
    neededFrom: new Date(Date.parse(startAt) - need.beforeStartMinutes * 60_000).toISOString(),
    neededUntil: new Date(Date.parse(endAt) + need.afterEndMinutes * 60_000).toISOString(),
    allocatedTo: need.allocatedTo, notes: need.notes, createdAt: timestamp, updatedAt: timestamp,
  }));
  return {
    id: occurrenceId(series.id, originalDate), source: "series", seriesId: series.id, occurrenceDate: originalDate,
    title: series.title, category: series.category, status: "confirmed", startAt, endAt, allDay: false,
    placeId: exception && "placeId" in exception ? exception.placeId : series.defaultPlaceId,
    participants: [...series.defaultParticipants], responsibleAdults: exception?.responsibleAdults ? [...exception.responsibleAdults] : [...series.defaultResponsibleAdults],
    prepTasks, resourceNeeds, notes: exception?.notes ?? series.notes, createdAt: series.createdAt, updatedAt: timestamp,
  };
}

function allowedBySchool(series: EventSeries, date: string, calendar?: SchoolCalendar) {
  return !series.recurrence.termTimeOnly || getSchoolDayStatus(calendar, date).status !== "closed";
}

export function applySeriesExceptions(series: EventSeries, occurrences: EventOccurrence[]) {
  return occurrences.filter((occurrence) => series.exceptions.find((item) => item.occurrenceDate === occurrence.occurrenceDate)?.type !== "cancelled");
}

export function expandSeriesForRange(series: EventSeries, rangeStart: string, rangeEndExclusive: string, options: SeriesExpansionOptions = {}) {
  if (series.status !== "active") return [];
  const materialised = new Set((options.materialisedEvents ?? []).filter((event) => event.seriesId === series.id && event.occurrenceDate).map((event) => event.occurrenceDate));
  const occurrences: EventOccurrence[] = [];
  for (let date = rangeStart; date < rangeEndExclusive; date = addDaysToDateKey(date, 1)) {
    if (!matchesRule(series, date) || materialised.has(date)) continue;
    const exception = series.exceptions.find((item) => item.occurrenceDate === date);
    if (exception?.type === "cancelled" || exception?.movedToDate) continue;
    if (!allowedBySchool(series, date, options.schoolCalendar)) continue;
    occurrences.push(buildOccurrence(series, date));
  }
  for (const exception of series.exceptions) {
    if (!exception.movedToDate || exception.movedToDate < rangeStart || exception.movedToDate >= rangeEndExclusive || materialised.has(exception.occurrenceDate)) continue;
    if (!matchesRule(series, exception.occurrenceDate) || !allowedBySchool(series, exception.movedToDate, options.schoolCalendar)) continue;
    occurrences.push(buildOccurrence(series, exception.occurrenceDate));
  }
  return occurrences.sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function expandAllSeriesForRange(series: EventSeries[], rangeStart: string, rangeEndExclusive: string, options: SeriesExpansionOptions = {}) {
  return series.flatMap((item) => expandSeriesForRange(item, rangeStart, rangeEndExclusive, options)).sort((a, b) => a.startAt.localeCompare(b.startAt));
}
