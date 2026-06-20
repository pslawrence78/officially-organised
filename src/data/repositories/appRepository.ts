import { db } from "../db";
import {
  seedCountdownTargets,
  seedFamilyMembers,
  seedHousehold,
  seedResources,
  seedSchoolCalendar,
  seedSettings,
  seedTemplates,
} from "../seedData/initialData";

const INITIAL_SEED_SETTING_ID = "initial_seed_completed";
const SCHOOL_CALENDAR_SEED_SETTING_ID = "school_calendar_seed_completed";
const COUNTDOWN_SEED_SETTING_ID = "countdown_seed_completed";

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
      db.schoolCalendars,
      db.countdownTargets,
    ],
    async () => {
      const seedMarker = await db.settings.get(INITIAL_SEED_SETTING_ID);

      const timestamp = new Date().toISOString();

      if (!await db.settings.get(SCHOOL_CALENDAR_SEED_SETTING_ID)) {
        await db.schoolCalendars.put(seedSchoolCalendar);
        await db.settings.put({ id: SCHOOL_CALENDAR_SEED_SETTING_ID, value: timestamp, description: "Illustrative Tranche 5A school calendar seed" });
      }

      if (!await db.settings.get(COUNTDOWN_SEED_SETTING_ID)) {
        await db.countdownTargets.bulkPut(seedCountdownTargets);
        await db.settings.put({ id: COUNTDOWN_SEED_SETTING_ID, value: timestamp, description: "Illustrative Tranche 5B countdown seed" });
      }

      if (seedMarker) return false;

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
          summary: "Initial Officially Organised seed data created",
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
