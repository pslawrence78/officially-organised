import type { CelebrationOccasion, FamilyEvent, FamilyEventInput, GiftPlan, PrepTask } from "../domain/types";
import { createCelebration, createEvent, createGiftPlan } from "../data/repositories";
import { generateGiftPlanPrepTasks } from "../services/giftPlanPrepService";
import { addDaysToDateKey, localDateTimeToIso } from "../utils/dates";

const TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const CELEBRATION_FIXTURE_NOW = new Date("2026-06-20T09:00:00.000Z");
export const CELEBRATION_FIXTURE_TODAY = "2026-06-20";

function buildEventInput(
  id: string,
  title: string,
  date: string,
  overrides: Partial<FamilyEventInput> = {},
): FamilyEventInput {
  return {
    title,
    category: "family_social",
    status: "confirmed",
    startAt: localDateTimeToIso(`${date}T10:00`),
    endAt: localDateTimeToIso(`${date}T12:00`),
    allDay: false,
    participants: ["member_phil"],
    responsibleAdults: ["member_phil"],
    prepTasks: [],
    resourceNeeds: [],
    notes: id,
    ...overrides,
  };
}

function buildPrepTask(
  id: string,
  title: string,
  dueAt: string,
  overrides: Partial<PrepTask> = {},
): PrepTask {
  return {
    id,
    title,
    ownerIds: ["member_phil"],
    dueAt,
    priority: "important",
    status: "open",
    blocksEvent: false,
    notes: "Generated from Gifts & Celebrations.",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

export function buildCelebrationFixtureSet(baseDate = CELEBRATION_FIXTURE_TODAY) {
  const sebBirthdayDate = addDaysToDateKey(baseDate, 1);
  const familyBirthdayDate = addDaysToDateKey(baseDate, 8);

  const sebBirthdayEvent: FamilyEvent = {
    id: "event_seb_birthday_party",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...buildEventInput(
      "event_seb_birthday_party",
      "Seb birthday party for Oliver Theodore-Smythe",
      sebBirthdayDate,
      {
        category: "birthday_party",
        participants: ["member_seb"],
        responsibleAdults: ["member_phil", "member_beck"],
        prepTasks: [
          buildPrepTask("prep_gift_seb_party_wrap_present", "Wrap present", localDateTimeToIso(`${sebBirthdayDate}T19:00`)),
          buildPrepTask("prep_gift_seb_party_write_card", "Write card", localDateTimeToIso(`${sebBirthdayDate}T19:30`)),
        ],
      },
    ),
  };

  const familyBirthdayEvent: FamilyEvent = {
    id: "event_family_birthday_lunch",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...buildEventInput(
      "event_family_birthday_lunch",
      "Nanna June birthday lunch",
      familyBirthdayDate,
      {
        category: "family_social",
        participants: ["member_phil", "member_beck", "member_seb"],
        responsibleAdults: ["member_phil", "member_beck"],
      },
    ),
  };

  const occasions: CelebrationOccasion[] = [
    {
      id: "celebration_seb_birthday_party",
      householdId: "household_lawrence",
      title: "Seb birthday party for Oliver Theodore-Smythe",
      occasionType: "birthday_party",
      date: sebBirthdayDate,
      recurrence: "none",
      linkedEventId: sebBirthdayEvent.id,
      linkedMemberId: "member_seb",
      recipientName: "Oliver Theodore-Smythe",
      relationshipContext: "school_friend",
      ownerAdultIds: ["member_phil", "member_beck"],
      status: "planned",
      notes: "Present is bought but still needs wrapping, and the card is still open.",
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    {
      id: "celebration_family_birthday",
      householdId: "household_lawrence",
      title: "Nanna June birthday lunch",
      occasionType: "birthday",
      date: familyBirthdayDate,
      recurrence: "annual",
      linkedEventId: familyBirthdayEvent.id,
      recipientName: "Nanna June",
      relationshipContext: "family",
      ownerAdultIds: ["member_phil"],
      status: "planned",
      notes: "Mostly ready and calm.",
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    {
      id: "celebration_christmas_2026",
      householdId: "household_lawrence",
      title: "Christmas 2026 for the whole household with extra stocking bits",
      occasionType: "seasonal",
      date: "2026-12-25",
      recurrence: "annual",
      ownerAdultIds: ["member_phil", "member_beck"],
      status: "planned",
      notes: "Mixed household readiness to prove the longer-range planning cases.",
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
  ];

  const giftPlans: GiftPlan[] = [
    {
      id: "gift_seb_party",
      celebrationId: "celebration_seb_birthday_party",
      linkedEventId: sebBirthdayEvent.id,
      recipientName: "Oliver Theodore-Smythe",
      responsibleAdultId: "member_beck",
      giftSummary: "Remote-control stunt car",
      giftStatus: "bought",
      cardStatus: "bought",
      rsvpStatus: "accepted",
      targetDate: sebBirthdayDate,
      buyBy: baseDate,
      wrapBy: sebBirthdayDate,
      takeBy: sebBirthdayDate,
      budgetNote: "About £18",
      linkedPrepTaskIds: ["prep_gift_seb_party_wrap_present", "prep_gift_seb_party_write_card"],
      notes: "Bought and sorted, but wrapping and card still need finishing.",
      archived: false,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    {
      id: "gift_family_birthday",
      celebrationId: "celebration_family_birthday",
      linkedEventId: familyBirthdayEvent.id,
      recipientName: "Nanna June",
      responsibleAdultId: "member_phil",
      giftSummary: "Garden centre voucher and tea tin",
      giftStatus: "packed",
      cardStatus: "packed",
      rsvpStatus: "not_needed",
      targetDate: familyBirthdayDate,
      buyBy: addDaysToDateKey(baseDate, 3),
      wrapBy: addDaysToDateKey(baseDate, 6),
      takeBy: familyBirthdayDate,
      budgetNote: "Kept under £30",
      linkedPrepTaskIds: [],
      notes: "Wrapped and ready.",
      archived: false,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    {
      id: "gift_christmas_phil",
      celebrationId: "celebration_christmas_2026",
      recipientMemberId: "member_phil",
      recipientName: "Phil",
      responsibleAdultId: "member_beck",
      giftSummary: "Idea only for a coffee grinder upgrade",
      giftStatus: "idea",
      cardStatus: "not_needed",
      rsvpStatus: "not_needed",
      targetDate: "2026-12-25",
      buyBy: "2026-11-20",
      wrapBy: "2026-12-20",
      takeBy: "2026-12-25",
      budgetNote: "Still deciding on spend",
      linkedPrepTaskIds: [],
      archived: false,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    {
      id: "gift_christmas_beck",
      celebrationId: "celebration_christmas_2026",
      recipientMemberId: "member_beck",
      recipientName: "Beck",
      responsibleAdultId: "member_phil",
      giftSummary: "Booked pottery workshop",
      giftStatus: "ordered",
      cardStatus: "written",
      rsvpStatus: "not_needed",
      targetDate: "2026-12-25",
      buyBy: "2026-11-30",
      wrapBy: "2026-12-22",
      takeBy: "2026-12-25",
      budgetNote: "Paid deposit",
      linkedPrepTaskIds: [],
      archived: false,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    {
      id: "gift_christmas_seb",
      celebrationId: "celebration_christmas_2026",
      recipientMemberId: "member_seb",
      recipientName: "Seb",
      responsibleAdultId: "member_phil",
      giftSummary: "Microscope set",
      giftStatus: "wrapped",
      cardStatus: "not_needed",
      rsvpStatus: "not_needed",
      targetDate: "2026-12-25",
      buyBy: "2026-11-18",
      wrapBy: "2026-12-10",
      takeBy: "2026-12-25",
      budgetNote: "Main present ready",
      linkedPrepTaskIds: [],
      archived: false,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    {
      id: "gift_christmas_albert",
      celebrationId: "celebration_christmas_2026",
      recipientMemberId: "member_albert",
      recipientName: "Albert",
      responsibleAdultId: "member_beck",
      giftSummary: "New dog lead and treats",
      giftStatus: "given",
      cardStatus: "not_needed",
      rsvpStatus: "not_needed",
      targetDate: "2026-12-25",
      buyBy: "2026-11-10",
      wrapBy: "2026-12-05",
      takeBy: "2026-12-24",
      budgetNote: "Already sorted",
      linkedPrepTaskIds: [],
      archived: false,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
  ];

  return {
    occasions,
    giftPlans,
    events: [sebBirthdayEvent, familyBirthdayEvent],
  };
}

export async function seedCelebrationFixtureSet(baseDate = CELEBRATION_FIXTURE_TODAY) {
  const sebBirthdayDate = addDaysToDateKey(baseDate, 1);
  const familyBirthdayDate = addDaysToDateKey(baseDate, 8);

  const sebEvent = await createEvent(buildEventInput(
    "event_seb_birthday_party",
    "Seb birthday party for Oliver Theodore-Smythe",
    sebBirthdayDate,
    {
      category: "birthday_party",
      participants: ["member_seb"],
      responsibleAdults: ["member_phil", "member_beck"],
    },
  ));
  const familyEvent = await createEvent(buildEventInput(
    "event_family_birthday_lunch",
    "Nanna June birthday lunch",
    familyBirthdayDate,
    {
      participants: ["member_phil", "member_beck", "member_seb"],
      responsibleAdults: ["member_phil", "member_beck"],
    },
  ));

  const sebCelebration = await createCelebration({
    householdId: "household_lawrence",
    title: "Seb birthday party for Oliver Theodore-Smythe",
    occasionType: "birthday_party",
    date: sebBirthdayDate,
    recurrence: "none",
    linkedEventId: sebEvent.id,
    linkedMemberId: "member_seb",
    recipientName: "Oliver Theodore-Smythe",
    relationshipContext: "school_friend",
    ownerAdultIds: ["member_phil", "member_beck"],
    status: "planned",
    notes: "Present is bought but still needs wrapping, and the card is still open.",
  });
  const familyCelebration = await createCelebration({
    householdId: "household_lawrence",
    title: "Nanna June birthday lunch",
    occasionType: "birthday",
    date: familyBirthdayDate,
    recurrence: "annual",
    linkedEventId: familyEvent.id,
    recipientName: "Nanna June",
    relationshipContext: "family",
    ownerAdultIds: ["member_phil"],
    status: "planned",
    notes: "Mostly ready and calm.",
  });
  const christmasCelebration = await createCelebration({
    householdId: "household_lawrence",
    title: "Christmas 2026 for the whole household with extra stocking bits",
    occasionType: "seasonal",
    date: "2026-12-25",
    recurrence: "annual",
    ownerAdultIds: ["member_phil", "member_beck"],
    status: "planned",
    notes: "Mixed household readiness to prove the longer-range planning cases.",
  });

  const sebPlan = await createGiftPlan({
    celebrationId: sebCelebration.id,
    linkedEventId: sebEvent.id,
    recipientName: "Oliver Theodore-Smythe",
    responsibleAdultId: "member_beck",
    giftSummary: "Remote-control stunt car",
    giftStatus: "bought",
    cardStatus: "bought",
    rsvpStatus: "accepted",
    targetDate: sebBirthdayDate,
    buyBy: baseDate,
    wrapBy: sebBirthdayDate,
    takeBy: sebBirthdayDate,
    budgetNote: "About £18",
    linkedPrepTaskIds: [],
    notes: "Bought and sorted, but wrapping and card still need finishing.",
    archived: false,
  });
  await generateGiftPlanPrepTasks(sebPlan.id);

  await createGiftPlan({
    celebrationId: familyCelebration.id,
    linkedEventId: familyEvent.id,
    recipientName: "Nanna June",
    responsibleAdultId: "member_phil",
    giftSummary: "Garden centre voucher and tea tin",
    giftStatus: "packed",
    cardStatus: "packed",
    rsvpStatus: "not_needed",
    targetDate: familyBirthdayDate,
    buyBy: addDaysToDateKey(baseDate, 3),
    wrapBy: addDaysToDateKey(baseDate, 6),
    takeBy: familyBirthdayDate,
    budgetNote: "Kept under £30",
    linkedPrepTaskIds: [],
    notes: "Wrapped and ready.",
    archived: false,
  });

  await createGiftPlan({
    celebrationId: christmasCelebration.id,
    recipientMemberId: "member_phil",
    recipientName: "Phil",
    responsibleAdultId: "member_beck",
    giftSummary: "Idea only for a coffee grinder upgrade",
    giftStatus: "idea",
    cardStatus: "not_needed",
    rsvpStatus: "not_needed",
    targetDate: "2026-12-25",
    buyBy: "2026-11-20",
    wrapBy: "2026-12-20",
    takeBy: "2026-12-25",
    budgetNote: "Still deciding on spend",
    linkedPrepTaskIds: [],
    archived: false,
  });
  await createGiftPlan({
    celebrationId: christmasCelebration.id,
    recipientMemberId: "member_beck",
    recipientName: "Beck",
    responsibleAdultId: "member_phil",
    giftSummary: "Booked pottery workshop",
    giftStatus: "ordered",
    cardStatus: "written",
    rsvpStatus: "not_needed",
    targetDate: "2026-12-25",
    buyBy: "2026-11-30",
    wrapBy: "2026-12-22",
    takeBy: "2026-12-25",
    budgetNote: "Paid deposit",
    linkedPrepTaskIds: [],
    archived: false,
  });
  await createGiftPlan({
    celebrationId: christmasCelebration.id,
    recipientMemberId: "member_seb",
    recipientName: "Seb",
    responsibleAdultId: "member_phil",
    giftSummary: "Microscope set",
    giftStatus: "wrapped",
    cardStatus: "not_needed",
    rsvpStatus: "not_needed",
    targetDate: "2026-12-25",
    buyBy: "2026-11-18",
    wrapBy: "2026-12-10",
    takeBy: "2026-12-25",
    budgetNote: "Main present ready",
    linkedPrepTaskIds: [],
    archived: false,
  });
  await createGiftPlan({
    celebrationId: christmasCelebration.id,
    recipientMemberId: "member_albert",
    recipientName: "Albert",
    responsibleAdultId: "member_beck",
    giftSummary: "New dog lead and treats",
    giftStatus: "given",
    cardStatus: "not_needed",
    rsvpStatus: "not_needed",
    targetDate: "2026-12-25",
    buyBy: "2026-11-10",
    wrapBy: "2026-12-05",
    takeBy: "2026-12-24",
    budgetNote: "Already sorted",
    linkedPrepTaskIds: [],
    archived: false,
  });
}
