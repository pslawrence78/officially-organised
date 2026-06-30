import type { ExportStoreName } from "../types/importExport";

export const STORE_LABELS: Record<ExportStoreName, string> = {
  households: "Households",
  familyMembers: "Family members",
  resources: "Resources",
  places: "Places",
  events: "Events",
  eventSeries: "Routines",
  templates: "Templates",
  settings: "Settings",
  celebrationOccasions: "Celebrations",
  giftPlans: "Gift plans",
  householdAdminItems: "Household admin",
  schoolCalendars: "School calendars",
  schoolHalfTermConfigs: "School half-terms",
  schoolReadinessPrepActions: "School prep actions",
  countdownTargets: "Countdowns",
  auditLog: "Audit entries",
};

export const EXCLUDED_EXPORT_TABLES = [
  "weatherForecasts",
  "syncSettings",
  "syncDevices",
  "syncState",
  "syncQueue",
  "syncConflicts",
] as const;

export const MAJOR_DIAGNOSTIC_STORES: ExportStoreName[] = [
  "events",
  "eventSeries",
  "schoolReadinessPrepActions",
  "householdAdminItems",
  "celebrationOccasions",
  "giftPlans",
  "schoolHalfTermConfigs",
  "countdownTargets",
];
