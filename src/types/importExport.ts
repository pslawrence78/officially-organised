import type {
  AuditLogEntry, CelebrationOccasion, CountdownTarget, EventSeries, FamilyEvent, FamilyMember, GiftPlan,
  Household, Place, Resource, SchoolCalendar, SchoolHalfTermConfig, SchoolReadinessPrepAction, Setting, StarterTemplate,
} from "../domain/types";

export const EXPORT_STORE_NAMES = [
  "households", "familyMembers", "resources", "places", "events", "eventSeries",
  "templates", "settings", "celebrationOccasions", "giftPlans", "schoolCalendars", "schoolHalfTermConfigs", "schoolReadinessPrepActions", "countdownTargets", "auditLog",
] as const;

export type ExportStoreName = typeof EXPORT_STORE_NAMES[number];
export type ImportRecordCounts = Record<ExportStoreName, number>;

export interface ExportDataPayload {
  households: Household[];
  familyMembers: FamilyMember[];
  resources: Resource[];
  places: Place[];
  events: FamilyEvent[];
  eventSeries: EventSeries[];
  templates: StarterTemplate[];
  settings: Setting[];
  celebrationOccasions: CelebrationOccasion[];
  giftPlans: GiftPlan[];
  schoolCalendars: SchoolCalendar[];
  schoolHalfTermConfigs: SchoolHalfTermConfig[];
  schoolReadinessPrepActions: SchoolReadinessPrepAction[];
  countdownTargets: CountdownTarget[];
  auditLog: AuditLogEntry[];
}

export interface ExportEnvelope {
  schema: string;
  schemaVersion: number;
  sourceAppName: "Officially Organised";
  exportId: string;
  exportedAt: string;
  appVersion: string;
  databaseVersion: number;
  recordCounts: ImportRecordCounts;
  data: ExportDataPayload;
}

export interface ImportValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  path?: string;
  relatedId?: string;
}

export interface ImportPreview {
  sourceAppName: string;
  schema: string;
  exportedAt: string;
  appVersion?: string;
  databaseVersion?: number;
  importedRecordCounts: ImportRecordCounts;
  currentRecordCounts: ImportRecordCounts;
  mode: "replace";
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ImportValidationIssue[];
  warnings: ImportValidationIssue[];
  preview?: ImportPreview;
  payload?: ExportEnvelope;
}

export interface RestoreResult {
  restored: true;
  restoredAt: string;
  recordCounts: ImportRecordCounts;
  safetySnapshot: ExportEnvelope;
}

export type ParseImportResult =
  | { ok: true; value: unknown }
  | { ok: false; issue: ImportValidationIssue };
