import { db } from "../data/db";
import type { SchoolReadinessForDate, SchoolReadinessPrepAction, SchoolReadinessPrepCandidate } from "../domain/types";
import type { WeatherAwareSchoolSuggestion } from "../types/weather";

const HOUSEHOLD_ID = "household_lawrence";
const MEMBER_ID = "member_seb";

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(36);
}

function candidate(date: string, sourceKey: string, values: Partial<SchoolReadinessPrepCandidate> & Pick<SchoolReadinessPrepCandidate, "title" | "category">): SchoolReadinessPrepCandidate {
  const sourceType = values.sourceType ?? "operational_school_readiness";
  return {
    id: `school_prep_${date}_${hash(`${MEMBER_ID}:${sourceType}:${sourceKey}`)}`,
    householdId: HOUSEHOLD_ID, memberId: MEMBER_ID, schoolDate: date, sourceType, sourceKey,
    sourceVersion: values.sourceVersion ?? "1", title: values.title, detail: values.detail, category: values.category,
    owner: values.owner ?? "either", priority: values.priority ?? "important", blocksSchoolReadiness: values.blocksSchoolReadiness ?? true,
    dueAt: values.dueAt ?? `${date}T07:30:00.000Z`, originLabel: values.originLabel ?? (sourceType === "weather_school_suggestion" ? "Weather-aware" : "School readiness"),
  };
}

export function deriveSchoolReadinessPrepCandidates(readiness: SchoolReadinessForDate, weatherSuggestions: WeatherAwareSchoolSuggestion[] = []): SchoolReadinessPrepCandidate[] {
  if (readiness.schoolStatus !== "open") return [];
  const date = readiness.date;
  const result: SchoolReadinessPrepCandidate[] = [];
  if (readiness.lunch.type === "packed_lunch") result.push(candidate(date, `school:${date}:lunch:packed`, { title: "Prepare packed lunch", category: "lunch", priority: "critical" }));
  if (!readiness.lunch.isKnown || readiness.lunch.type === "unknown") result.push(candidate(date, `school:${date}:lunch:unknown`, { title: "Check Seb’s lunch arrangement", category: "check_required" }));
  if (readiness.attire.type === "pe_kit") result.push(candidate(date, `school:${date}:attire:pe-kit`, { title: "Pack PE kit", category: "pe", priority: "critical" }));
  if (!readiness.attire.isKnown || readiness.attire.type === "unknown") result.push(candidate(date, `school:${date}:attire:unknown`, { title: "Check Seb’s school clothing requirement", category: "check_required" }));
  if (readiness.forestSchool.required && readiness.forestSchool.wellingtonBoots) result.push(candidate(date, `school:${date}:forest-school:wellies`, { title: "Put Forest School wellies ready", category: "forest_school", priority: "critical" }));
  if (readiness.forestSchool.required && readiness.forestSchool.longTrousers) result.push(candidate(date, `school:${date}:forest-school:long-trousers`, { title: "Prepare long trousers for Forest School", category: "forest_school" }));
  if (readiness.forestSchool.required && readiness.forestSchool.waterproofs) result.push(candidate(date, `school:${date}:forest-school:waterproofs`, { title: "Pack Forest School waterproofs", category: "forest_school" }));

  for (const suggestion of weatherSuggestions) {
    const title = suggestion.suggestedPrepTaskTitle ?? suggestion.title;
    const normalized = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const operationalDuplicate = result.some((item) => item.title.toLowerCase().replace(/^pack |^prepare |^put |^take /, "") === title.toLowerCase().replace(/^pack |^prepare |^put |^take /, ""));
    if (operationalDuplicate) continue;
    result.push(candidate(date, `weather:${date}:${suggestion.category}:${normalized}`, {
      sourceType: "weather_school_suggestion", sourceVersion: suggestion.id, title, detail: suggestion.detail, category: "weather",
      priority: suggestion.severity === "important" ? "important" : "normal", blocksSchoolReadiness: false,
    }));
  }
  return result;
}

export async function upsertSchoolReadinessPrepActionsForRange(readiness: SchoolReadinessForDate[], weatherByDate: Record<string, WeatherAwareSchoolSuggestion[]> = {}) {
  if (!readiness.length) return [];
  const candidates = readiness.flatMap((item) => deriveSchoolReadinessPrepCandidates(item, weatherByDate[item.date] ?? []));
  const start = readiness[0].date; const end = readiness[readiness.length - 1].date; const now = new Date().toISOString();
  return db.transaction("rw", db.schoolReadinessPrepActions, db.auditLog, async () => {
    const existing = await db.schoolReadinessPrepActions.where("schoolDate").between(start, end, true, true).toArray();
    const byId = new Map(existing.map((item) => [item.id, item])); const activeIds = new Set(candidates.map((item) => item.id));
    const created: SchoolReadinessPrepAction[] = [];
    for (const value of candidates) {
      const current = byId.get(value.id);
      if (!current) created.push({ ...value, status: "open", createdAt: now, updatedAt: now });
      else if (current.status === "open" && (current.sourceVersion !== value.sourceVersion || current.title !== value.title || current.detail !== value.detail || current.priority !== value.priority)) created.push({ ...current, ...value, updatedAt: now });
    }
    const stale = existing.filter((item) => item.status === "open" && !activeIds.has(item.id));
    if (created.length) await db.schoolReadinessPrepActions.bulkPut(created);
    if (stale.length) await db.schoolReadinessPrepActions.bulkPut(stale.map((item) => ({ ...item, status: "stale", staleAt: now, staleReason: "The underlying school or weather requirement changed.", updatedAt: now })));
    const genuinelyNew = created.filter((item) => !byId.has(item.id));
    if (genuinelyNew.length) await db.auditLog.bulkPut(genuinelyNew.map((item) => ({ id: `audit_school_prep_created_${item.id}`, entityType: "school_readiness_prep_action", entityId: item.id, action: "created", timestamp: now, summary: `Created school readiness prep action: ${item.title}` })));
    if (stale.length) await db.auditLog.bulkPut(stale.map((item) => ({ id: `audit_school_prep_stale_${item.id}_${Date.now()}`, entityType: "school_readiness_prep_action", entityId: item.id, action: "marked_stale", timestamp: now, summary: `Marked school readiness prep action stale: ${item.title}` })));
    return db.schoolReadinessPrepActions.where("schoolDate").between(start, end, true, true).toArray();
  });
}

export function schoolPrepSummary(actions: SchoolReadinessPrepAction[]) {
  const open = actions.filter((item) => item.status === "open");
  return { open: open.length, blocking: open.filter((item) => item.blocksSchoolReadiness).length, weather: open.filter((item) => item.sourceType === "weather_school_suggestion").length, complete: actions.length > 0 && open.length === 0 };
}
