import { APP_VERSION } from "../config/appVersion";
import { db, databaseMetadata } from "../data/db";
import { getSyncSettings, saveSetting } from "../data/repositories";
import { EXPORT_DATA_SCHEMA, EXPORT_SCHEMA_VERSION } from "../domain/constants";
import type { ExportStoreName, ImportRecordCounts } from "../types/importExport";
import { getLocalDataSummary } from "./importExportService";
import { MAJOR_DIAGNOSTIC_STORES, STORE_LABELS } from "./dataBoundaries";

const BETA_CHECKLIST_SETTING_ID = "beta_readiness_checklist";
export const LAST_EXPORT_SETTING_ID = "last_export_completed_at";

export interface BetaChecklistState {
  iphoneInstallChecked: boolean;
  standaloneLaunchChecked: boolean;
  offlineReopenChecked: boolean;
  backupExportChecked: boolean;
  restoreRehearsedChecked: boolean;
  twoDeviceSyncChecked: boolean;
  layoutChecked: boolean;
  updatedAt?: string;
}

export interface BetaChecklistItem {
  key: keyof Omit<BetaChecklistState, "updatedAt">;
  label: string;
  help: string;
}

export type ReadinessLabel = "Ready" | "Needs checking" | "Not configured" | "Offline" | "Unknown";

export interface BetaReadinessReport {
  appVersion: string;
  dexieSchemaVersion: number;
  appDataSchema: string;
  exportSchema: string;
  exportSchemaVersion: number;
  online: ReadinessLabel;
  pwaStandalone: ReadinessLabel;
  serviceWorker: ReadinessLabel;
  sync: ReadinessLabel;
  syncEnabled: boolean;
  supabaseConfigured: boolean;
  lastSyncAttemptAt?: string;
  lastSyncAt?: string;
  pendingSyncRecords: number;
  openConflicts: number;
  lastExportAt?: string;
  storeCounts: ImportRecordCounts;
  majorStoreCounts: Array<{ store: ExportStoreName; label: string; count: number }>;
  checklist: BetaChecklistState;
}

const defaultChecklistState: BetaChecklistState = {
  iphoneInstallChecked: false,
  standaloneLaunchChecked: false,
  offlineReopenChecked: false,
  backupExportChecked: false,
  restoreRehearsedChecked: false,
  twoDeviceSyncChecked: false,
  layoutChecked: false,
};

export const betaChecklistItems: BetaChecklistItem[] = [
  { key: "iphoneInstallChecked", label: "Installed on iPhone", help: "Added from Safari and opened from the Home Screen." },
  { key: "standaloneLaunchChecked", label: "Standalone launch checked", help: "Opened without Safari chrome and loaded the dashboard safely." },
  { key: "offlineReopenChecked", label: "Offline reopen checked", help: "Closed fully, reopened offline, and confirmed local planning still works." },
  { key: "backupExportChecked", label: "Backup export checked", help: "Downloaded a local backup on a real device before relying on beta use." },
  { key: "restoreRehearsedChecked", label: "Restore rehearsed", help: "Validated a controlled restore test before treating backup as the safety net." },
  { key: "twoDeviceSyncChecked", label: "Two-device sync checked", help: "Ran the safe Supabase validation flow on two devices if sync is enabled." },
  { key: "layoutChecked", label: "Layout and tap targets checked", help: "Main routes stayed usable on iPhone widths with no blocking overflow." },
];

export async function getBetaChecklistState(): Promise<BetaChecklistState> {
  const setting = await db.settings.get(BETA_CHECKLIST_SETTING_ID);
  if (!setting || typeof setting.value !== "object" || !setting.value) return defaultChecklistState;
  return { ...defaultChecklistState, ...(setting.value as Partial<BetaChecklistState>) };
}

export async function updateBetaChecklistItem(
  key: keyof Omit<BetaChecklistState, "updatedAt">,
  checked: boolean,
): Promise<BetaChecklistState> {
  const existing = await getBetaChecklistState();
  const next: BetaChecklistState = {
    ...existing,
    [key]: checked,
    updatedAt: new Date().toISOString(),
  };
  await saveSetting(BETA_CHECKLIST_SETTING_ID, next, "Manual beta-readiness progress for this device");
  return next;
}

function runtimeOnlineLabel(): ReadinessLabel {
  if (typeof navigator === "undefined") return "Unknown";
  return navigator.onLine === false ? "Offline" : "Ready";
}

function runtimeStandaloneLabel(): ReadinessLabel {
  if (typeof window === "undefined") return "Unknown";
  const media = typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: standalone)") : undefined;
  const legacyStandalone = "standalone" in navigator ? (navigator as Navigator & { standalone?: boolean }).standalone === true : false;
  return media?.matches || legacyStandalone ? "Ready" : "Needs checking";
}

async function runtimeServiceWorkerLabel(): Promise<ReadinessLabel> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return "Unknown";
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return "Needs checking";
    if (registration.active) return "Ready";
    if (registration.installing || registration.waiting) return "Needs checking";
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

function syncLabel(setting: Awaited<ReturnType<typeof getSyncSettings>>): ReadinessLabel {
  if (!setting.supabaseConfigured) return "Not configured";
  if (setting.enabled && !setting.paused) return "Ready";
  return "Needs checking";
}

async function getLastExportAt(): Promise<string | undefined> {
  const tracked = await db.settings.get(LAST_EXPORT_SETTING_ID);
  if (typeof tracked?.value === "string") return tracked.value;
  const auditEntries = await db.auditLog.where("entityType").equals("system").toArray();
  return auditEntries
    .filter((entry) => entry.action === "exported")
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0]
    ?.timestamp;
}

export async function getBetaReadinessReport(): Promise<BetaReadinessReport> {
  const [syncSettings, storeCounts, checklist, serviceWorker, lastExportAt] = await Promise.all([
    getSyncSettings(),
    getLocalDataSummary(),
    getBetaChecklistState(),
    runtimeServiceWorkerLabel(),
    getLastExportAt(),
  ]);

  return {
    appVersion: APP_VERSION,
    dexieSchemaVersion: databaseMetadata.schemaVersion,
    appDataSchema: databaseMetadata.appDataSchema,
    exportSchema: EXPORT_DATA_SCHEMA,
    exportSchemaVersion: EXPORT_SCHEMA_VERSION,
    online: runtimeOnlineLabel(),
    pwaStandalone: runtimeStandaloneLabel(),
    serviceWorker,
    sync: syncLabel(syncSettings),
    syncEnabled: Boolean(syncSettings.enabled && !syncSettings.paused),
    supabaseConfigured: syncSettings.supabaseConfigured,
    lastSyncAttemptAt: syncSettings.lastSyncAttemptAt,
    lastSyncAt: syncSettings.lastSyncAt,
    pendingSyncRecords: syncSettings.queueCount ?? 0,
    openConflicts: syncSettings.conflictCount ?? 0,
    lastExportAt,
    storeCounts,
    majorStoreCounts: MAJOR_DIAGNOSTIC_STORES.map((store) => ({
      store,
      label: STORE_LABELS[store],
      count: storeCounts[store],
    })),
    checklist,
  };
}

export function createBetaDiagnosticsText(report: BetaReadinessReport) {
  return [
    "Officially Organised release readiness diagnostics",
    `Generated: ${new Date().toISOString()}`,
    `App version: ${report.appVersion}`,
    `Dexie schema: ${report.dexieSchemaVersion}`,
    `App data schema: ${report.appDataSchema}`,
    `Export schema: ${report.exportSchema} v${report.exportSchemaVersion}`,
    `Online: ${report.online === "Ready" ? "true" : report.online === "Offline" ? "false" : report.online}`,
    `PWA standalone: ${report.pwaStandalone}`,
    `Service worker: ${report.serviceWorker}`,
    `Sync enabled: ${report.syncEnabled ? "true" : "false"}`,
    `Supabase configured: ${report.supabaseConfigured ? "true" : "false"}`,
    `Pending sync records: ${report.pendingSyncRecords}`,
    `Open sync conflicts: ${report.openConflicts}`,
    `Last sync success: ${report.lastSyncAt ?? "Not yet recorded"}`,
    `Last sync attempt: ${report.lastSyncAttemptAt ?? "Not yet recorded"}`,
    `Last export: ${report.lastExportAt ?? "Not yet recorded"}`,
    "Store counts:",
    ...report.majorStoreCounts.map(({ label, count }) => `- ${label}: ${count}`),
  ].join("\n");
}

export function getAllPersistentTableNames() {
  return db.tables.map((table) => table.name).sort();
}
