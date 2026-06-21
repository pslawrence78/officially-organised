import type { SchoolAttireType, SchoolCalendar, SchoolDayRequirementEntry, SchoolHalfTermConfig, SchoolLunchType, SchoolReadinessForDate } from "../domain/types";
import { addDaysToDateKey } from "../utils/dates";
import { getSchoolDayStatus } from "./schoolCalendarService";

export const LUNCH_LABELS: Record<SchoolLunchType, string> = { packed_lunch: "Packed lunch", school_dinner: "School dinner", home_lunch: "Home lunch", not_required: "Not required", unknown: "Not yet known" };
export const ATTIRE_LABELS: Record<SchoolAttireType, string> = { school_uniform: "School uniform", pe_kit: "PE kit", non_uniform: "Non-uniform", not_required: "Not required", unknown: "Not yet known" };
const EMPTY_FOREST = { required: false, wellingtonBoots: false, longTrousers: false };

export function getSchoolReadinessForDate(calendar: SchoolCalendar | undefined, configs: SchoolHalfTermConfig[], date: string): SchoolReadinessForDate {
  const status = getSchoolDayStatus(calendar, date);
  const config = calendar ? configs.find((item) => item.schoolCalendarId === calendar.id && item.startDate <= date && date <= item.endDate) : undefined;
  const entry = config?.entries.find((item) => item.date === date);
  const lunchType = entry?.lunchType ?? "unknown";
  const attireType = entry?.attireType ?? "unknown";
  const result: SchoolReadinessForDate = { date, schoolStatus: status.status, schoolStatusLabel: status.label, hasConfiguration: Boolean(entry), configLabel: config?.label, lunch: { type: lunchType, label: LUNCH_LABELS[lunchType], choice: entry?.lunchChoice, notes: entry?.lunchNotes, isKnown: Boolean(entry) && lunchType !== "unknown" }, attire: { type: attireType, label: ATTIRE_LABELS[attireType], notes: entry?.attireNotes, isKnown: Boolean(entry) && attireType !== "unknown" }, forestSchool: entry?.forestSchool ?? EMPTY_FOREST, readinessItems: [] };
  if (status.status === "closed") return result;
  if (status.status === "unknown") result.readinessItems.push({ id: `school-status-${date}`, label: "School status is not yet known.", severity: "warning", category: "unknown" });
  if (status.status === "open" && !entry) result.readinessItems.push({ id: `school-config-${date}`, label: "School requirements not configured for this day.", severity: "warning", category: "unknown" });
  if (entry && lunchType === "unknown") result.readinessItems.push({ id: `school-lunch-${date}`, label: "Lunch choice not yet known.", severity: "warning", category: "lunch" });
  if (entry && attireType === "unknown") result.readinessItems.push({ id: `school-attire-${date}`, label: "PE / uniform requirement not yet known.", severity: "warning", category: "attire" });
  if (entry?.forestSchool.required) result.readinessItems.push({ id: `forest-${date}`, label: "Forest School kit required.", severity: "info", category: "forest_school" });
  return result;
}

export function getSchoolReadinessForRange(calendar: SchoolCalendar | undefined, configs: SchoolHalfTermConfig[], startDate: string, endDate: string) {
  const values: SchoolReadinessForDate[] = [];
  for (let date = startDate; date <= endDate; date = addDaysToDateKey(date, 1)) values.push(getSchoolReadinessForDate(calendar, configs, date));
  return values;
}

export function createDefaultEntriesForHalfTerm(id: string, schoolCalendar: SchoolCalendar, startDate: string, endDate: string): SchoolDayRequirementEntry[] {
  const now = new Date().toISOString(); const entries: SchoolDayRequirementEntry[] = [];
  for (let date = startDate; date <= endDate; date = addDaysToDateKey(date, 1)) {
    const status = getSchoolDayStatus(schoolCalendar, date);
    if (status.status === "open") entries.push({ id: `${id}:${date}`, schoolCalendarId: schoolCalendar.id, halfTermConfigId: id, date, schoolStatusAtCreation: status.status, lunchType: "unknown", attireType: "unknown", forestSchool: { ...EMPTY_FOREST }, createdAt: now, updatedAt: now });
  }
  return entries;
}

export function validateSchoolHalfTermConfig(config: SchoolHalfTermConfig, others: SchoolHalfTermConfig[] = []) {
  const errors: string[] = []; const warnings: string[] = [];
  if (!config.label.trim()) errors.push("Add a half-term label.");
  if (!config.startDate || !config.endDate || config.endDate < config.startDate) errors.push("Choose a valid date range.");
  if (others.some((other) => other.id !== config.id && other.schoolCalendarId === config.schoolCalendarId && other.startDate <= config.endDate && config.startDate <= other.endDate)) errors.push("This half-term overlaps another configuration.");
  if (config.entries.some((entry) => entry.lunchType === "unknown" || entry.attireType === "unknown")) warnings.push("Some open school days still have unknown requirements.");
  if (new Set(config.entries.map((entry) => entry.date)).size !== config.entries.length) errors.push("Each date can appear only once in a half-term.");
  return { valid: errors.length === 0, errors, warnings };
}
