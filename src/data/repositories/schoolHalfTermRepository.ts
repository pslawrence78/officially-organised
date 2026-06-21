import type { SchoolHalfTermConfig } from "../../domain/types";
import { db } from "../db";

export function listSchoolHalfTermConfigs() { return db.schoolHalfTermConfigs.orderBy("startDate").reverse().toArray(); }
export function getSchoolHalfTermConfigById(id: string) { return db.schoolHalfTermConfigs.get(id); }
export function listSchoolHalfTermConfigsForCalendar(schoolCalendarId: string) { return db.schoolHalfTermConfigs.where("schoolCalendarId").equals(schoolCalendarId).sortBy("startDate"); }
export async function getSchoolHalfTermConfigForDate(schoolCalendarId: string, date: string) { return (await listSchoolHalfTermConfigsForCalendar(schoolCalendarId)).find((config) => config.startDate <= date && date <= config.endDate); }
export async function saveSchoolHalfTermConfig(config: SchoolHalfTermConfig) {
  const now = new Date().toISOString();
  const saved = { ...config, createdAt: config.createdAt || now, updatedAt: now, entries: config.entries.map((entry) => ({ ...entry, createdAt: entry.createdAt || now, updatedAt: now })) };
  await db.schoolHalfTermConfigs.put(saved);
  return saved;
}
export function deleteSchoolHalfTermConfig(id: string) { return db.schoolHalfTermConfigs.delete(id); }
