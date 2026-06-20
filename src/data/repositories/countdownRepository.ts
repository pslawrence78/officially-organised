import type { CountdownTarget } from "../../domain/types";
import { db } from "../db";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export async function getCountdownTargets() {
  return db.countdownTargets.orderBy("targetDate").toArray();
}

export async function getCountdownTarget(id: string) {
  return db.countdownTargets.get(id);
}

export async function saveCountdownTarget(target: CountdownTarget): Promise<CountdownTarget> {
  if (!target.title.trim()) throw new Error("Countdown title is required.");
  if (!DATE_KEY.test(target.targetDate)) throw new Error("Countdown target date must use YYYY-MM-DD.");
  const now = new Date().toISOString();
  const saved = { ...target, title: target.title.trim(), notes: target.notes?.trim() || undefined, createdAt: target.createdAt || now, updatedAt: now };
  await db.countdownTargets.put(saved);
  return saved;
}
