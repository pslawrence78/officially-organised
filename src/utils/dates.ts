import { HOUSEHOLD_TIME_ZONE } from "../domain/constants";
import type { FamilyEvent } from "../domain/types";

function partsForDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: HOUSEHOLD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function timeZoneOffsetMs(date: Date) {
  const parts = partsForDate(date);
  const representedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return representedAsUtc - date.getTime();
}

export function localDateTimeToIso(localValue: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localValue);
  if (!match) throw new Error("Invalid local date and time");
  const [, year, month, day, hour, minute] = match;
  const localAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  let utc = localAsUtc;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    utc = localAsUtc - timeZoneOffsetMs(new Date(utc));
  }
  return new Date(utc).toISOString();
}

export function dateKeyToIsoStart(dateKey: string) {
  return localDateTimeToIso(`${dateKey}T00:00`);
}

export function isoToDateKey(iso: string) {
  const parts = partsForDate(new Date(iso));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isoToDateTimeLocal(iso: string) {
  const parts = partsForDate(new Date(iso));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function currentDateKey(now = new Date()) {
  return isoToDateKey(now.toISOString());
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function getWeekStartDateKey(dateKey = currentDateKey()) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  return addDaysToDateKey(dateKey, -mondayOffset);
}

export function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

export function formatWeekRange(mondayDateKey: string) {
  const sunday = addDaysToDateKey(mondayDateKey, 6);
  const format = (key: string, includeMonth = true) => new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: includeMonth ? "short" : undefined,
  }).format(new Date(`${key}T12:00:00Z`));
  return `${format(mondayDateKey)} – ${format(sunday)}`;
}

export function formatEventTime(event: FamilyEvent) {
  if (event.allDay) return "All day";
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: HOUSEHOLD_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${formatter.format(new Date(event.startAt))}–${formatter.format(new Date(event.endAt))}`;
}

export function defaultEventTimes(now = new Date()) {
  const rounded = new Date(now);
  rounded.setUTCMinutes(0, 0, 0);
  rounded.setUTCHours(rounded.getUTCHours() + 1);
  const end = new Date(rounded.getTime() + 60 * 60 * 1000);
  return {
    start: isoToDateTimeLocal(rounded.toISOString()),
    end: isoToDateTimeLocal(end.toISOString()),
  };
}

export function allDayEndIso(inclusiveEndDateKey: string) {
  return dateKeyToIsoStart(addDaysToDateKey(inclusiveEndDateKey, 1));
}

export function inclusiveAllDayEndDateKey(endIso: string) {
  return isoToDateKey(new Date(new Date(endIso).getTime() - 1).toISOString());
}
