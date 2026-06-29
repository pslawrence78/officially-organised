export interface RemoteSyncEntity {
  household_id: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  payload_hash: string;
  schema_version: string;
  client_updated_at: string;
  server_updated_at: string;
  deleted_at?: string | null;
  updated_by?: string | null;
}

export interface SyncRunStats {
  pulled: number;
  pushed: number;
  conflicts: number;
  queueCount: number;
}

export type SyncErrorCode =
  | "sync_not_configured"
  | "sync_not_enabled"
  | "first_sync_not_confirmed"
  | "not_signed_in"
  | "household_not_linked"
  | "offline"
  | "permission_denied"
  | "remote_schema_missing"
  | "payload_validation_failed"
  | "conflict_detected"
  | "partial_sync"
  | "unknown";

export type SyncRunResult =
  | { ok: true; message: string; stats: SyncRunStats }
  | { ok: false; message: string; stats: SyncRunStats };
