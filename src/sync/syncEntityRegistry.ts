import type { ExportStoreName } from "../types/importExport";

export interface SyncEntityDefinition {
  entityType: ExportStoreName;
  tableName: ExportStoreName;
  updatedAtField?: string;
  titleField?: string;
}

export const SYNC_ENTITY_DEFINITIONS: SyncEntityDefinition[] = [
  { entityType: "households", tableName: "households", titleField: "name" },
  { entityType: "familyMembers", tableName: "familyMembers", titleField: "displayName" },
  { entityType: "resources", tableName: "resources", titleField: "name" },
  { entityType: "places", tableName: "places", updatedAtField: "updatedAt", titleField: "name" },
  { entityType: "events", tableName: "events", updatedAtField: "updatedAt", titleField: "title" },
  { entityType: "eventSeries", tableName: "eventSeries", updatedAtField: "updatedAt", titleField: "title" },
  { entityType: "templates", tableName: "templates", titleField: "name" },
  { entityType: "settings", tableName: "settings" },
  { entityType: "celebrationOccasions", tableName: "celebrationOccasions", updatedAtField: "updatedAt", titleField: "title" },
  { entityType: "giftPlans", tableName: "giftPlans", updatedAtField: "updatedAt", titleField: "recipientName" },
  { entityType: "householdAdminItems", tableName: "householdAdminItems", updatedAtField: "updatedAt", titleField: "title" },
  { entityType: "schoolCalendars", tableName: "schoolCalendars", updatedAtField: "updatedAt", titleField: "schoolName" },
  { entityType: "schoolHalfTermConfigs", tableName: "schoolHalfTermConfigs", updatedAtField: "updatedAt", titleField: "label" },
  { entityType: "schoolReadinessPrepActions", tableName: "schoolReadinessPrepActions", updatedAtField: "updatedAt", titleField: "title" },
  { entityType: "countdownTargets", tableName: "countdownTargets", updatedAtField: "updatedAt", titleField: "title" },
];

export const SYNCED_ENTITY_TYPES = SYNC_ENTITY_DEFINITIONS.map((item) => item.entityType);

export const EXCLUDED_SYNC_STORES = [
  "weatherForecasts",
  "auditLog",
  "syncSettings",
  "syncDevices",
  "syncState",
  "syncQueue",
  "syncConflicts",
] as const;

export function getSyncEntityDefinition(entityType: string) {
  return SYNC_ENTITY_DEFINITIONS.find((item) => item.entityType === entityType);
}

export function getSyncEntityTitle(entityType: string, payload: unknown) {
  const definition = getSyncEntityDefinition(entityType);
  if (!definition || !payload || typeof payload !== "object") return entityType;
  const title = (payload as Record<string, unknown>)[definition.titleField ?? ""];
  return typeof title === "string" && title.trim().length > 0 ? title : entityType;
}
