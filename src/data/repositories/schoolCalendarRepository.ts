import type { SchoolCalendar } from "../../domain/types";
import { db } from "../db";

export async function getSchoolCalendar(childMemberId = "member_seb") {
  return db.schoolCalendars.where("childMemberId").equals(childMemberId).first();
}

export async function saveSchoolCalendar(calendar: SchoolCalendar): Promise<SchoolCalendar> {
  const now = new Date().toISOString();
  const saved = { ...calendar, updatedAt: now, createdAt: calendar.createdAt || now };
  await db.schoolCalendars.put(saved);
  return saved;
}
