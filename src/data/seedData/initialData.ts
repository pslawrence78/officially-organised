import { APP_DATA_SCHEMA, EVENT_CATEGORIES } from "../../domain/constants";
import type {
  FamilyMember,
  Household,
  Resource,
  SchoolCalendar,
  Setting,
  StarterTemplate,
} from "../../domain/types";

export const seedHousehold: Household = {
  id: "household_lawrence",
  name: "Lawrence Family",
  timezone: "Europe/London",
  defaultStartOfWeek: "monday",
};

export const seedFamilyMembers: FamilyMember[] = [
  {
    id: "member_phil",
    displayName: "Phil",
    memberType: "adult",
    active: true,
  },
  {
    id: "member_beck",
    displayName: "Beck",
    memberType: "adult",
    active: true,
  },
  {
    id: "member_seb",
    displayName: "Seb",
    memberType: "child",
    defaultResponsibleAdults: ["member_phil", "member_beck"],
    active: true,
  },
  {
    id: "member_albert",
    displayName: "Albert",
    memberType: "pet",
    defaultResponsibleAdults: ["member_phil", "member_beck"],
    active: true,
  },
];

export const seedResources: Resource[] = [
  {
    id: "resource_family_car",
    name: "Family car",
    resourceType: "car",
    shared: true,
    active: true,
  },
];

export const seedTemplates: StarterTemplate[] = [
  {
    id: "template_swimming_lesson",
    name: "Swimming lesson",
    category: "lesson",
    defaultDurationMinutes: 30,
    defaultPrepTasks: ["Swimming kit", "Towel", "Goggles", "Water bottle"],
    defaultCarNeed: "required",
  },
  {
    id: "template_gymnastics",
    name: "Gymnastics",
    category: "club",
    defaultDurationMinutes: 60,
    defaultPrepTasks: ["Gymnastics kit", "Water bottle"],
    defaultCarNeed: "required",
  },
  {
    id: "template_beavers",
    name: "Beavers",
    category: "club",
    defaultDurationMinutes: 90,
    defaultPrepTasks: ["Uniform", "Neckerchief", "Water bottle"],
    defaultCarNeed: "required",
  },
  {
    id: "template_birthday_party",
    name: "Birthday party",
    category: "birthday_party",
    defaultDurationMinutes: 120,
    defaultPrepTasks: ["Buy present", "Write card", "Check address"],
    defaultCarNeed: "maybe",
  },
  {
    id: "template_baby_group_block",
    name: "Baby Group block",
    category: "baby_group",
    defaultDurationMinutes: 120,
    defaultPrepTasks: ["Changing bag", "Snacks", "Check booking"],
    defaultCarNeed: "required",
  },
  {
    id: "template_oracle_office_day",
    name: "Oracle office day",
    category: "work",
    defaultDurationMinutes: 480,
    defaultPrepTasks: ["Laptop", "Charger", "Security pass"],
    defaultCarNeed: "maybe",
  },
  {
    id: "template_vet_appointment",
    name: "Vet appointment",
    category: "vet",
    defaultDurationMinutes: 30,
    defaultPrepTasks: ["Lead", "Treatment notes", "Insurance details"],
    defaultCarNeed: "required",
  },
  {
    id: "template_health_appointment",
    name: "Dentist or health appointment",
    category: "medical",
    defaultDurationMinutes: 30,
    defaultPrepTasks: ["Appointment letter", "Relevant medication"],
    defaultCarNeed: "maybe",
  },
  {
    id: "template_school_special_day",
    name: "School special day",
    category: "school",
    defaultDurationMinutes: 420,
    defaultPrepTasks: ["Check school message", "Prepare special kit"],
    defaultCarNeed: "not_required",
  },
];

export const seedSettings: Setting[] = [
  {
    id: "app_data_schema",
    value: APP_DATA_SCHEMA,
    description: "Current application data schema identifier",
  },
  {
    id: "event_categories",
    value: EVENT_CATEGORIES,
    description: "Available event categories",
  },
];

const schoolSeedTimestamp = "2026-01-01T00:00:00.000Z";

/** Illustrative only: these are not official dates for any real school. */
export const seedSchoolCalendar: SchoolCalendar = {
  id: "school_calendar_seb_2025_26",
  childMemberId: "member_seb",
  schoolName: "Illustrative Primary School",
  academicYearLabel: "2025/26",
  timezone: "Europe/London",
  periods: [
    { id: "school_period_summer_term", label: "Illustrative Summer Term", type: "term", startDate: "2026-04-20", endDate: "2026-07-17" },
    { id: "school_period_summer_half_term", label: "Illustrative Summer Half Term", type: "holiday", startDate: "2026-05-25", endDate: "2026-05-29" },
  ],
  closureDays: [
    { id: "school_closure_inset", date: "2026-06-26", type: "inset", label: "Illustrative INSET Day" },
  ],
  createdAt: schoolSeedTimestamp,
  updatedAt: schoolSeedTimestamp,
};
