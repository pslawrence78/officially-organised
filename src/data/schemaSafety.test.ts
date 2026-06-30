import { describe, expect, it } from "vitest";
import { databaseMetadata } from "./db";
import { EXCLUDED_SYNC_STORES, SYNCED_ENTITY_TYPES } from "../sync/syncEntityRegistry";
import { EXPORT_SCHEMA_VERSION } from "../domain/constants";
import { EXPORT_STORE_NAMES } from "../types/importExport";
import { EXCLUDED_EXPORT_TABLES } from "../services/dataBoundaries";
import { getAllPersistentTableNames } from "../services/betaReadinessService";

describe("schema safety guardrails", () => {
  it("covers every persistent Dexie table with either export or explicit exclusion", () => {
    const covered = [...EXPORT_STORE_NAMES, ...EXCLUDED_EXPORT_TABLES].sort();
    expect(getAllPersistentTableNames()).toEqual(covered);
  });

  it("keeps sync scope within exported durable stores", () => {
    expect(SYNCED_ENTITY_TYPES.every((store) => EXPORT_STORE_NAMES.includes(store))).toBe(true);
    expect(SYNCED_ENTITY_TYPES.some((store) => EXCLUDED_SYNC_STORES.includes(store as never))).toBe(false);
  });

  it("keeps the app data schema intentionally aligned to the Dexie schema version", () => {
    expect(databaseMetadata.appDataSchema).toBe(`lawrence-loop-data-v${databaseMetadata.schemaVersion}`);
  });

  it("keeps the current export schema version intentional", () => {
    expect(EXPORT_SCHEMA_VERSION).toBe(5);
  });
});
