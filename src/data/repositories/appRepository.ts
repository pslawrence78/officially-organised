import { db } from "../db";
import {
  seedFamilyMembers,
  seedHousehold,
  seedResources,
  seedSettings,
  seedTemplates,
} from "../seedData/initialData";

const INITIAL_SEED_SETTING_ID = "initial_seed_completed";

export async function seedInitialDataIfNeeded(): Promise<boolean> {
  return db.transaction(
    "rw",
    [
      db.households,
      db.familyMembers,
      db.resources,
      db.templates,
      db.settings,
      db.auditLog,
    ],
    async () => {
      const seedMarker = await db.settings.get(INITIAL_SEED_SETTING_ID);

      if (seedMarker) {
        return false;
      }

      const timestamp = new Date().toISOString();

      await Promise.all([
        db.households.put(seedHousehold),
        db.familyMembers.bulkPut(seedFamilyMembers),
        db.resources.bulkPut(seedResources),
        db.templates.bulkPut(seedTemplates),
        db.settings.bulkPut([
          ...seedSettings,
          {
            id: INITIAL_SEED_SETTING_ID,
            value: timestamp,
            description: "Timestamp of the initial Tranche 0 seed",
          },
        ]),
        db.auditLog.put({
          id: "audit_seed_initial_data",
          entityType: "system",
          entityId: "lawrence_loop_db",
          action: "seeded",
          timestamp,
          summary: "Initial Lawrence Loop seed data created",
        }),
      ]);

      return true;
    },
  );
}

export async function getHousehold() {
  return db.households.get("household_lawrence");
}

export async function getFamilyMembers() {
  return db.familyMembers.orderBy("id").toArray();
}

export async function getFamilyMemberById(id: string) {
  return db.familyMembers.get(id);
}

export async function getResources() {
  return db.resources.orderBy("id").toArray();
}

export async function getTemplates() {
  return db.templates.orderBy("name").toArray();
}

export async function getSettings() {
  return db.settings.orderBy("id").toArray();
}
