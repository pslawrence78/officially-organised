import { db } from "../data/db";
import {
  bulkUpsertSchoolPrepActions,
  createEvent,
  createHouseholdAdminItem,
  createSeries,
  getSchoolCalendar,
  saveSchoolHalfTermConfig,
} from "../data/repositories";
import type { CelebrationOccasion, EventSeriesInput, GiftPlan, SchoolHalfTermConfig, SchoolReadinessPrepAction } from "../domain/types";
import { addDaysToDateKey, localDateTimeToIso } from "../utils/dates";

export const DENSE_WEEK_NOW = "2026-06-24T08:30:00.000Z";
export const DENSE_WEEK_START = "2026-06-22";

function timestamp(dayOffset = 0, time = "07:00") {
  return localDateTimeToIso(`${addDaysToDateKey(DENSE_WEEK_START, dayOffset)}T${time}`);
}

function eventWindow(dayOffset: number, start: string, end: string) {
  return {
    startAt: localDateTimeToIso(`${addDaysToDateKey(DENSE_WEEK_START, dayOffset)}T${start}`),
    endAt: localDateTimeToIso(`${addDaysToDateKey(DENSE_WEEK_START, dayOffset)}T${end}`),
  };
}

export async function seedDenseLawrenceWeekFixture() {
  const createdAt = "2026-06-01T09:00:00.000Z";
  const schoolCalendar = await getSchoolCalendar();

  const config: SchoolHalfTermConfig = {
    id: "half_term_dense_week",
    schoolCalendarId: schoolCalendar!.id,
    label: "Illustrative Summer 2 dense week",
    startDate: DENSE_WEEK_START,
    endDate: addDaysToDateKey(DENSE_WEEK_START, 4),
    entries: [
      {
        id: "dense-entry-mon",
        schoolCalendarId: schoolCalendar!.id,
        halfTermConfigId: "half_term_dense_week",
        date: DENSE_WEEK_START,
        lunchType: "school_dinner",
        lunchChoice: "Pasta bake",
        attireType: "school_uniform",
        forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "dense-entry-tue",
        schoolCalendarId: schoolCalendar!.id,
        halfTermConfigId: "half_term_dense_week",
        date: addDaysToDateKey(DENSE_WEEK_START, 1),
        lunchType: "packed_lunch",
        attireType: "pe_kit",
        attireNotes: "Named water bottle as well.",
        forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "dense-entry-wed",
        schoolCalendarId: schoolCalendar!.id,
        halfTermConfigId: "half_term_dense_week",
        date: addDaysToDateKey(DENSE_WEEK_START, 2),
        lunchType: "packed_lunch",
        attireType: "school_uniform",
        forestSchool: { required: true, wellingtonBoots: true, longTrousers: true, waterproofs: true },
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "dense-entry-thu",
        schoolCalendarId: schoolCalendar!.id,
        halfTermConfigId: "half_term_dense_week",
        date: addDaysToDateKey(DENSE_WEEK_START, 3),
        lunchType: "school_dinner",
        attireType: "school_uniform",
        forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: "dense-entry-fri",
        schoolCalendarId: schoolCalendar!.id,
        halfTermConfigId: "half_term_dense_week",
        date: addDaysToDateKey(DENSE_WEEK_START, 4),
        lunchType: "packed_lunch",
        attireType: "non_uniform",
        forestSchool: { required: false, wellingtonBoots: false, longTrousers: false },
        createdAt,
        updatedAt: createdAt,
      },
    ],
    createdAt,
    updatedAt: createdAt,
  };
  await saveSchoolHalfTermConfig(config);

  const schoolActions: SchoolReadinessPrepAction[] = [
    {
      id: "dense-school-action-open",
      householdId: "household_lawrence",
      memberId: "member_seb",
      schoolDate: addDaysToDateKey(DENSE_WEEK_START, 2),
      sourceType: "operational_school_readiness",
      sourceKey: "dense-school-forest",
      sourceVersion: "1",
      title: "Pack Forest School waterproofs",
      detail: "Keep them by the front door tonight.",
      category: "forest_school",
      owner: "either",
      priority: "important",
      status: "open",
      blocksSchoolReadiness: false,
      dueAt: timestamp(1, "20:30"),
      createdAt,
      updatedAt: createdAt,
      originLabel: "School readiness",
    },
    {
      id: "dense-school-action-done",
      householdId: "household_lawrence",
      memberId: "member_seb",
      schoolDate: addDaysToDateKey(DENSE_WEEK_START, 2),
      sourceType: "operational_school_readiness",
      sourceKey: "dense-school-lunch",
      sourceVersion: "1",
      title: "Confirm packed lunch ingredients",
      category: "lunch",
      owner: "member_beck",
      priority: "normal",
      status: "done",
      blocksSchoolReadiness: false,
      dueAt: timestamp(1, "18:30"),
      createdAt,
      updatedAt: createdAt,
      completedAt: timestamp(1, "18:35"),
      originLabel: "School readiness",
    },
  ];
  await bulkUpsertSchoolPrepActions(schoolActions);

  const routine: EventSeriesInput = {
    title: "Beavers",
    category: "club",
    status: "active",
    recurrence: {
      frequency: "weekly",
      dayOfWeek: "wednesday",
      startDate: DENSE_WEEK_START,
      startTime: "18:00",
      durationMinutes: 90,
    },
    defaultParticipants: ["member_seb"],
    defaultResponsibleAdults: ["member_phil"],
    defaultResourceNeeds: [{
      id: "dense-routine-car",
      resourceId: "resource_family_car",
      needStatus: "required",
      beforeStartMinutes: 15,
      afterEndMinutes: 15,
    }],
    defaultPrepTasks: [{
      id: "dense-routine-uniform",
      title: "Check Beavers uniform",
      ownerIds: ["member_phil"],
      dueOffsetMinutes: -90,
      priority: "normal",
      blocksEvent: false,
    }],
    exceptions: [],
  };
  const beaversSeries = await createSeries(routine);

  await createEvent({
    title: "Seb gymnastics",
    category: "club",
    status: "confirmed",
    allDay: false,
    participants: ["member_seb"],
    responsibleAdults: ["member_beck"],
    prepTasks: [{
      id: "dense-gym-bag",
      title: "Pack gymnastics bag",
      ownerIds: ["member_beck"],
      dueAt: timestamp(0, "14:30"),
      priority: "normal",
      status: "done",
      blocksEvent: false,
      createdAt,
      updatedAt: createdAt,
    }],
    resourceNeeds: [{
      id: "dense-gym-car",
      resourceId: "resource_family_car",
      needStatus: "required",
      neededFrom: timestamp(0, "15:45"),
      neededUntil: timestamp(0, "17:15"),
      createdAt,
      updatedAt: createdAt,
    }],
    notes: "Illustrative club session only.",
    ...eventWindow(0, "16:00", "17:00"),
  });

  await createEvent({
    title: "Seb swimming",
    category: "lesson",
    status: "confirmed",
    allDay: false,
    participants: ["member_seb"],
    responsibleAdults: ["member_phil"],
    prepTasks: [{
      id: "dense-swim-kit",
      title: "Pack swim kit and towel",
      ownerIds: ["member_phil"],
      dueAt: timestamp(1, "15:00"),
      priority: "important",
      status: "open",
      blocksEvent: true,
      createdAt,
      updatedAt: createdAt,
    }],
    resourceNeeds: [{
      id: "dense-swim-car",
      resourceId: "resource_family_car",
      needStatus: "required",
      neededFrom: timestamp(1, "15:40"),
      neededUntil: timestamp(1, "17:20"),
      createdAt,
      updatedAt: createdAt,
    }],
    ...eventWindow(1, "16:00", "17:00"),
  });

  await createEvent({
    title: "Phil Oracle office customer planning day",
    category: "work",
    status: "confirmed",
    allDay: false,
    participants: ["member_phil"],
    responsibleAdults: ["member_phil"],
    prepTasks: [{
      id: "dense-oracle-laptop",
      title: "Charge laptop and meeting headset",
      ownerIds: ["member_phil"],
      dueAt: timestamp(2, "06:30"),
      priority: "important",
      status: "open",
      blocksEvent: false,
      createdAt,
      updatedAt: createdAt,
    }],
    resourceNeeds: [{
      id: "dense-oracle-car",
      resourceId: "resource_family_car",
      needStatus: "maybe",
      neededFrom: timestamp(2, "08:00"),
      neededUntil: timestamp(2, "17:30"),
      createdAt,
      updatedAt: createdAt,
    }],
    ...eventWindow(2, "08:30", "16:30"),
  });

  const birthdayEvent = await createEvent({
    title: "Birthday party at the wonderfully energetic indoor adventure place with a very long title",
    category: "birthday_party",
    status: "confirmed",
    allDay: false,
    participants: ["member_seb"],
    responsibleAdults: ["member_beck"],
    prepTasks: [{
      id: "dense-party-present",
      title: "Present, card and spare socks",
      ownerIds: ["member_beck"],
      dueAt: timestamp(5, "09:00"),
      priority: "important",
      status: "open",
      blocksEvent: false,
      createdAt,
      updatedAt: createdAt,
    }],
    resourceNeeds: [{
      id: "dense-party-car",
      resourceId: "resource_family_car",
      needStatus: "required",
      neededFrom: timestamp(5, "11:15"),
      neededUntil: timestamp(5, "15:30"),
      createdAt,
      updatedAt: createdAt,
    }],
    ...eventWindow(5, "12:00", "14:30"),
  });

  await createEvent({
    title: "Beck Baby Group",
    category: "baby_group",
    status: "confirmed",
    allDay: false,
    participants: ["member_beck"],
    responsibleAdults: ["member_beck"],
    prepTasks: [{
      id: "dense-baby-group",
      title: "Snacks and spare clothes",
      ownerIds: ["member_beck"],
      dueAt: timestamp(3, "08:15"),
      priority: "normal",
      status: "open",
      blocksEvent: false,
      createdAt,
      updatedAt: createdAt,
    }],
    resourceNeeds: [],
    ...eventWindow(3, "09:30", "11:00"),
  });

  await createEvent({
    title: "Albert vet check",
    category: "vet",
    status: "confirmed",
    allDay: false,
    participants: ["member_albert"],
    responsibleAdults: ["member_phil"],
    prepTasks: [{
      id: "dense-vet-notes",
      title: "Take treatment notes",
      ownerIds: ["member_phil"],
      dueAt: timestamp(3, "15:45"),
      priority: "normal",
      status: "open",
      blocksEvent: false,
      createdAt,
      updatedAt: createdAt,
    }],
    resourceNeeds: [{
      id: "dense-vet-car",
      resourceId: "resource_family_car",
      needStatus: "required",
      neededFrom: timestamp(3, "16:30"),
      neededUntil: timestamp(3, "18:00"),
      createdAt,
      updatedAt: createdAt,
    }],
    ...eventWindow(3, "17:00", "17:30"),
  });

  await createEvent({
    title: "Quiet library reminder",
    category: "reminder_only",
    status: "planned",
    allDay: false,
    participants: ["member_phil"],
    responsibleAdults: ["member_phil"],
    prepTasks: [],
    resourceNeeds: [],
    ...eventWindow(6, "15:00", "15:15"),
  });

  await createHouseholdAdminItem({
    title: "Family car insurance renewal",
    category: "insurance",
    adminType: "car_insurance",
    status: "active",
    dueDate: addDaysToDateKey(DENSE_WEEK_START, 4),
    renewalCycle: "annual",
    ownerMemberId: "member_phil",
    reminderDaysBefore: [14, 7, 1],
    referenceLabel: "Illustrative policy",
  });

  const celebration: CelebrationOccasion = {
    id: "dense-celebration",
    householdId: "household_lawrence",
    title: "Saturday birthday party",
    occasionType: "birthday_party",
    date: addDaysToDateKey(DENSE_WEEK_START, 5),
    recurrence: "none",
    linkedEventId: birthdayEvent.id,
    recipientName: "School friend",
    ownerAdultIds: ["member_beck"],
    status: "planned",
    createdAt,
    updatedAt: createdAt,
  };
  const giftPlan: GiftPlan = {
    id: "dense-gift-plan",
    celebrationId: celebration.id,
    linkedEventId: birthdayEvent.id,
    recipientName: "School friend",
    responsibleAdultId: "member_beck",
    giftSummary: "Illustrative art set",
    giftStatus: "bought",
    cardStatus: "written",
    rsvpStatus: "accepted",
    buyBy: addDaysToDateKey(DENSE_WEEK_START, 4),
    takeBy: addDaysToDateKey(DENSE_WEEK_START, 5),
    linkedPrepTaskIds: [],
    archived: false,
    createdAt,
    updatedAt: createdAt,
  };
  await db.celebrationOccasions.put(celebration);
  await db.giftPlans.put(giftPlan);

  return {
    birthdayEventId: birthdayEvent.id,
    beaversSeriesId: beaversSeries.id,
  };
}
