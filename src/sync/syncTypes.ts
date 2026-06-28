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

export type SyncRunResult =
  | { ok: true; message: string; stats: SyncRunStats }
  | { ok: false; message: string; stats: SyncRunStats };
