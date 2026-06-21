import {
  getEvents,
  getEventsForDate,
  getFamilyMembers,
  getPlaces,
  getPrepTasks,
  getSchoolCalendar,
  getResourceNeeds,
  listSchoolHalfTermConfigs,
  listSchoolPrepActionsByRange,
} from "../data/repositories";
import { CATEGORY_LABELS, FAMILY_CAR_RESOURCE_ID, PREP_TASK_PRIORITY_LABELS, RESOURCE_NEED_STATUS_LABELS } from "../domain/constants";
import type {
  Conflict,
  FamilyEvent,
  FamilyMember,
  Place,
  PrepTaskPriority,
  PrepTaskStatus,
  PrepTaskWithEvent,
  ResourceNeedWithEvent,
  SchoolReadinessForDate,
  SchoolReadinessPrepAction,
} from "../domain/types";
import { deriveSchoolReadinessPrepCandidates } from "./schoolReadinessPrepActionService";
import { getSchoolReadinessForDate } from "./schoolReadinessService";
import { getWeatherSchoolContexts } from "./weatherService";
import { calculateConflicts, conflictsForEvent } from "./conflictService";
import { addDaysToDateKey, currentDateKey, formatEventTime, formatLongDate, localDateTimeToIso } from "../utils/dates";
import { carNeedGroup, formatResourceWindow } from "../utils/resourceNeeds";
import { isPrepTaskOverdue } from "../utils/prepTasks";
import { hideInPrivacyMode, sanitizeHubText } from "../utils/privacyMode";
import type { WeatherSchoolContext } from "../types/weather";

type HubActionState = "open" | "done" | "skipped" | "stale";

export interface HubEventItem {
  id: string;
  title: string;
  eventCategoryLabel: string;
  timeLabel: string;
  participantsLabel: string;
  responsibleLabel: string;
  statusLabel: string;
  placeLabel?: string;
  locationDetail?: string;
  notes?: string;
  isRoutine: boolean;
  carBadge?: string;
  prepBadge?: string;
  attentionTone?: "warning" | "critical";
}

export interface HubSchoolActionItem {
  id: string;
  title: string;
  detail?: string;
  date: string;
  dueLabel: string;
  ownerLabel: string;
  sourceLabel: string;
  priorityLabel: string;
  state: HubActionState;
  blocksSchoolReadiness: boolean;
}

export interface HubDaySummary {
  date: string;
  label: string;
  schoolPreview?: string;
  prepPreview?: string;
  carPreview?: string;
  weatherPreview?: string;
  items: HubEventItem[];
}

export interface HubSchoolReadinessSummary {
  date: string;
  heading: string;
  schoolStatus: "open" | "closed" | "unknown";
  schoolStatusLabel: string;
  lunchLabel?: string;
  lunchChoice?: string;
  attireLabel?: string;
  attireNotes?: string;
  forestSchoolLabel?: string;
  warnings: string[];
  actions: HubSchoolActionItem[];
}

export interface HubWeatherSuggestionSummary {
  date: string;
  heading: string;
  status: WeatherSchoolContext["status"];
  statusLabel: string;
  forecastLabel?: string;
  locationLabel?: string;
  lastUpdatedLabel?: string;
  suggestions: Array<{
    id: string;
    category: string;
    title: string;
    detail?: string;
    severity: "info" | "suggestion" | "important";
  }>;
}

export interface HubCarWatchItem {
  id: string;
  eventId: string;
  eventTitle: string;
  dayLabel: string;
  windowLabel: string;
  needLabel: string;
  allocatedLabel: string;
  notes?: string;
  conflictTone?: "warning" | "critical";
  conflictLabel?: string;
}

export interface HubCriticalPrepItem {
  id: string;
  source: "event" | "school";
  title: string;
  detail?: string;
  dueLabel: string;
  priorityLabel: string;
  statusLabel: string;
  eventTitle?: string;
  eventId?: string;
  stateTone: "warning" | "critical" | "neutral";
}

export interface HubViewModel {
  generatedAt: string;
  today: HubDaySummary;
  tomorrow: HubDaySummary;
  schoolReadiness: HubSchoolReadinessSummary;
  weatherSuggestions: HubWeatherSuggestionSummary[];
  carWatch: HubCarWatchItem[];
  criticalPrep: HubCriticalPrepItem[];
  hiddenPrepCount: number;
  statuses: {
    isOffline: boolean;
    weatherStale: boolean;
    weatherConfigured: boolean;
    weatherUnavailable: boolean;
    privacyMode: boolean;
  };
}

interface BuildHubOptions {
  isOffline?: boolean;
  now?: Date;
  privacyMode?: boolean;
}

interface HubData {
  todayKey: string;
  tomorrowKey: string;
  familyMembers: FamilyMember[];
  places: Place[];
  todayEvents: FamilyEvent[];
  tomorrowEvents: FamilyEvent[];
  allEvents: FamilyEvent[];
  prepItems: PrepTaskWithEvent[];
  carItems: ResourceNeedWithEvent[];
  schoolReadinessToday: SchoolReadinessForDate;
  schoolReadinessTomorrow: SchoolReadinessForDate;
  weather: Record<string, WeatherSchoolContext>;
  schoolPrepActions: SchoolReadinessPrepAction[];
}

const MORNING_DEADLINE_HOUR = 9;
const HUB_PREP_LIMIT = 6;

function dateTimeLabel(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

function stateLabel(status: PrepTaskStatus | HubActionState) {
  return status === "done" ? "Done" : status === "skipped" ? "Skipped" : status === "stale" ? "Stale" : "Open";
}

function ownerLabel(owner: SchoolReadinessPrepAction["owner"]) {
  return owner === "either" ? "Phil or Beck" : owner === "both" ? "Phil and Beck" : owner === "member_phil" ? "Phil" : "Beck";
}

function weatherStatusLabel(status: WeatherSchoolContext["status"]) {
  if (status === "off") return "Weather off";
  if (status === "setup_required") return "Weather setup needed";
  if (status === "unavailable") return "Weather unavailable";
  if (status === "stale") return "Weather stale";
  return "Forecast ready";
}

function weatherForecastLabel(context: WeatherSchoolContext) {
  if (!context.forecast) return undefined;
  const parts = [context.forecast.condition.replaceAll("_", " ")];
  if (context.forecast.minTempC !== undefined && context.forecast.maxTempC !== undefined) {
    parts.push(`${Math.round(context.forecast.minTempC)}-${Math.round(context.forecast.maxTempC)}C`);
  }
  return parts.join(" · ");
}

function placeForEvent(places: Place[], event: FamilyEvent) {
  return event.placeId ? places.find((place) => place.id === event.placeId) : undefined;
}

function peopleLabel(familyMembers: FamilyMember[], ids: string[]) {
  return ids.map((id) => familyMembers.find((member) => member.id === id)?.displayName ?? "Unknown").join(", ");
}

function eventTone(conflicts: Conflict[], event: FamilyEvent) {
  const matching = conflictsForEvent(conflicts, event.id);
  if (matching.some((conflict) => conflict.severity === "critical")) return "critical";
  if (matching.length || event.responsibleAdults.length === 0) return "warning";
  return undefined;
}

function morningDeadline(dateKey: string) {
  return localDateTimeToIso(`${dateKey}T${String(MORNING_DEADLINE_HOUR).padStart(2, "0")}:00`);
}

function projectSchoolActions(
  readiness: SchoolReadinessForDate,
  weatherContext: WeatherSchoolContext | undefined,
  existing: SchoolReadinessPrepAction[],
  nowIso: string,
) {
  const candidates = deriveSchoolReadinessPrepCandidates(readiness, weatherContext?.suggestions ?? []);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const activeIds = new Set(candidates.map((item) => item.id));
  const projected = candidates.map((candidate) => existingById.get(candidate.id) ?? {
    ...candidate,
    status: "open" as const,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  const extra = existing.filter((item) => item.status === "stale" || !activeIds.has(item.id));
  return [...projected, ...extra].sort((left, right) =>
    (left.status === "open" ? 0 : left.status === "stale" ? 1 : 2) - (right.status === "open" ? 0 : right.status === "stale" ? 1 : 2)
    || Date.parse(left.dueAt) - Date.parse(right.dueAt)
    || left.title.localeCompare(right.title),
  );
}

function buildDaySummary(
  headingDate: string,
  events: FamilyEvent[],
  familyMembers: FamilyMember[],
  places: Place[],
  conflicts: Conflict[],
  privacyMode: boolean,
  readiness?: SchoolReadinessForDate,
  prepItems: HubCriticalPrepItem[] = [],
  carItems: HubCarWatchItem[] = [],
  weather?: HubWeatherSuggestionSummary,
): HubDaySummary {
  return {
    date: headingDate,
    label: formatLongDate(headingDate),
    schoolPreview: readiness ? readiness.schoolStatus === "open" ? `${readiness.lunch.label} · ${readiness.attire.label}` : readiness.schoolStatusLabel : undefined,
    prepPreview: prepItems.length ? `${prepItems.length} prep item${prepItems.length === 1 ? "" : "s"} due` : undefined,
    carPreview: carItems.length ? `${carItems.length} car window${carItems.length === 1 ? "" : "s"}` : undefined,
    weatherPreview: weather?.suggestions[0]?.title ?? (weather?.status !== "fresh" && weather?.status !== "stale" ? weather?.statusLabel : undefined),
    items: events.map((event) => {
      const place = placeForEvent(places, event);
      const openPrep = event.prepTasks.filter((task) => task.status === "open");
      const carNeed = event.resourceNeeds.find((need) => need.needStatus !== "not_required");
      return {
        id: event.id,
        title: event.title,
        eventCategoryLabel: CATEGORY_LABELS[event.category],
        timeLabel: formatEventTime(event),
        participantsLabel: peopleLabel(familyMembers, event.participants),
        responsibleLabel: event.responsibleAdults.length ? peopleLabel(familyMembers, event.responsibleAdults) : "Needs an adult",
        statusLabel: event.status,
        placeLabel: place?.name,
        locationDetail: hideInPrivacyMode(sanitizeHubText([place?.address, place?.postcode].filter(Boolean).join(", "), privacyMode), privacyMode),
        notes: sanitizeHubText(event.notes, privacyMode),
        isRoutine: Boolean(event.seriesId && event.occurrenceDate),
        carBadge: carNeed ? `Car ${RESOURCE_NEED_STATUS_LABELS[carNeed.needStatus].toLowerCase()}` : undefined,
        prepBadge: openPrep.length ? `${openPrep.length} prep open` : undefined,
        attentionTone: eventTone(conflicts, event),
      };
    }),
  };
}

function buildReadinessSummary(
  readiness: SchoolReadinessForDate,
  actions: SchoolReadinessPrepAction[],
  privacyMode: boolean,
  heading: string,
): HubSchoolReadinessSummary {
  return {
    date: readiness.date,
    heading,
    schoolStatus: readiness.schoolStatus,
    schoolStatusLabel: readiness.schoolStatusLabel,
    lunchLabel: readiness.schoolStatus === "closed" ? undefined : readiness.lunch.label,
    lunchChoice: readiness.schoolStatus === "closed" ? undefined : sanitizeHubText(readiness.lunch.choice, privacyMode),
    attireLabel: readiness.schoolStatus === "closed" ? undefined : readiness.attire.label,
    attireNotes: readiness.schoolStatus === "closed" ? undefined : sanitizeHubText(readiness.attire.notes, privacyMode),
    forestSchoolLabel: readiness.schoolStatus === "open" && readiness.forestSchool.required ? "Forest School kit needed" : undefined,
    warnings: readiness.readinessItems.map((item) => item.label),
    actions: actions.map((action) => ({
      id: action.id,
      title: action.title,
      detail: sanitizeHubText(action.detail, privacyMode),
      date: action.schoolDate,
      dueLabel: dateTimeLabel(action.dueAt),
      ownerLabel: ownerLabel(action.owner),
      sourceLabel: action.originLabel,
      priorityLabel: PREP_TASK_PRIORITY_LABELS[action.priority],
      state: action.status,
      blocksSchoolReadiness: action.blocksSchoolReadiness,
    })),
  };
}

function buildWeatherSummary(context: WeatherSchoolContext, date: string, privacyMode: boolean, heading: string): HubWeatherSuggestionSummary {
  return {
    date,
    heading,
    status: context.status,
    statusLabel: weatherStatusLabel(context.status),
    forecastLabel: weatherForecastLabel(context),
    locationLabel: hideInPrivacyMode(sanitizeHubText(context.settings.locationLabel, privacyMode), privacyMode),
    lastUpdatedLabel: context.snapshot ? dateTimeLabel(context.snapshot.fetchedAt) : undefined,
    suggestions: context.suggestions.map((item) => ({
      id: item.id,
      category: item.category.replaceAll("_", " "),
      title: item.title,
      detail: sanitizeHubText(item.detail, privacyMode),
      severity: item.severity,
    })),
  };
}

function buildCarWatch(
  carItems: ResourceNeedWithEvent[],
  conflicts: Conflict[],
  familyMembers: FamilyMember[],
  now: Date,
  privacyMode: boolean,
): HubCarWatchItem[] {
  return carItems
    .filter(({ need }) => ["today", "tomorrow"].includes(carNeedGroup(need, now)))
    .filter(({ need }) => Date.parse(need.neededUntil ?? "") >= now.getTime())
    .map(({ need, event }) => {
      const eventConflicts = conflictsForEvent(conflicts, event.id).filter((item) => item.type === "car_clash" || item.type === "maybe_car_clash");
      const allocated = need.allocatedTo ? familyMembers.find((member) => member.id === need.allocatedTo)?.displayName ?? "Unknown" : "Not allocated";
      const critical = eventConflicts.some((item) => item.severity === "critical");
      const conflictTone: HubCarWatchItem["conflictTone"] = eventConflicts.length ? (critical ? "critical" : "warning") : undefined;
      return {
        id: `${event.id}-${need.id}`,
        eventId: event.id,
        eventTitle: event.title,
        dayLabel: carNeedGroup(need, now) === "today" ? "Today" : "Tomorrow",
        windowLabel: formatResourceWindow(need),
        needLabel: RESOURCE_NEED_STATUS_LABELS[need.needStatus],
        allocatedLabel: allocated,
        notes: sanitizeHubText(need.notes, privacyMode),
        conflictTone,
        conflictLabel: eventConflicts.length ? (critical ? "Clash" : "Possible clash") : undefined,
      };
    })
    .sort((left, right) => left.windowLabel.localeCompare(right.windowLabel));
}

function buildCriticalPrep(
  eventPrep: PrepTaskWithEvent[],
  schoolPrep: SchoolReadinessPrepAction[],
  now: Date,
  tomorrowKey: string,
  privacyMode: boolean,
): { items: HubCriticalPrepItem[]; hiddenCount: number } {
  const deadline = Date.parse(morningDeadline(tomorrowKey));
  const eventItems = eventPrep
    .filter(({ task, event }) => task.status === "open" && event.status !== "cancelled")
    .filter(({ task }) => {
      if (!task.dueAt) return false;
      const due = Date.parse(task.dueAt);
      return isPrepTaskOverdue(task, now) || task.priority === "critical" || due < deadline;
    })
    .map(({ task, event }) => ({
      id: `event-${event.id}-${task.id}`,
      source: "event" as const,
      title: task.title,
      detail: sanitizeHubText(task.notes, privacyMode),
      dueLabel: task.dueAt ? dateTimeLabel(task.dueAt) : "No due time",
      priorityLabel: PREP_TASK_PRIORITY_LABELS[task.priority],
      statusLabel: stateLabel(task.status),
      eventTitle: event.title,
      eventId: event.id,
      stateTone: (task.priority === "critical" || task.blocksEvent || isPrepTaskOverdue(task, now) ? "critical" : "warning") as HubCriticalPrepItem["stateTone"],
      sortKey: `${task.priority === "critical" ? 0 : task.blocksEvent ? 1 : isPrepTaskOverdue(task, now) ? 2 : 3}-${task.dueAt ?? ""}-${task.title}`,
    }));

  const schoolItems = schoolPrep
    .filter((item) => item.status === "open")
    .filter((item) => item.priority === "critical" || Date.parse(item.dueAt) < deadline || item.blocksSchoolReadiness)
    .map((item) => ({
      id: `school-${item.id}`,
      source: "school" as const,
      title: item.title,
      detail: sanitizeHubText(item.detail, privacyMode),
      dueLabel: dateTimeLabel(item.dueAt),
      priorityLabel: PREP_TASK_PRIORITY_LABELS[item.priority],
      statusLabel: stateLabel(item.status),
      stateTone: (item.priority === "critical" || item.blocksSchoolReadiness ? "critical" : "warning") as HubCriticalPrepItem["stateTone"],
      sortKey: `${item.priority === "critical" ? 0 : item.blocksSchoolReadiness ? 1 : 2}-${item.dueAt}-${item.title}`,
    }));

  const combined = [...eventItems, ...schoolItems].sort((left, right) => left.sortKey.localeCompare(right.sortKey));
  return {
    items: combined.slice(0, HUB_PREP_LIMIT).map(({ sortKey: _sortKey, ...item }) => item),
    hiddenCount: Math.max(0, combined.length - HUB_PREP_LIMIT),
  };
}

export function buildHubViewModel(data: HubData, options: Required<BuildHubOptions>): HubViewModel {
  const nowIso = options.now.toISOString();
  const conflicts = calculateConflicts(data.allEvents, options.now);
  const todayWeather = buildWeatherSummary(data.weather[data.todayKey], data.todayKey, options.privacyMode, "Today");
  const tomorrowWeather = buildWeatherSummary(data.weather[data.tomorrowKey], data.tomorrowKey, options.privacyMode, "Tomorrow");
  const todaySchoolActions = projectSchoolActions(
    data.schoolReadinessToday,
    data.weather[data.todayKey],
    data.schoolPrepActions.filter((item) => item.schoolDate === data.todayKey),
    nowIso,
  );
  const tomorrowSchoolActions = projectSchoolActions(
    data.schoolReadinessTomorrow,
    data.weather[data.tomorrowKey],
    data.schoolPrepActions.filter((item) => item.schoolDate === data.tomorrowKey),
    nowIso,
  );
  const carWatch = buildCarWatch(data.carItems, conflicts, data.familyMembers, options.now, options.privacyMode);
  const criticalPrep = buildCriticalPrep(
    data.prepItems,
    [...todaySchoolActions, ...tomorrowSchoolActions],
    options.now,
    data.tomorrowKey,
    options.privacyMode,
  );

  return {
    generatedAt: nowIso,
    today: buildDaySummary(
      data.todayKey,
      data.todayEvents.filter((event) => event.status !== "cancelled"),
      data.familyMembers,
      data.places,
      conflicts,
      options.privacyMode,
      data.schoolReadinessToday,
      criticalPrep.items.filter((item) => item.source === "event" || item.source === "school").slice(0, 2),
      carWatch.filter((item) => item.dayLabel === "Today"),
      todayWeather,
    ),
    tomorrow: buildDaySummary(
      data.tomorrowKey,
      data.tomorrowEvents.filter((event) => event.status !== "cancelled"),
      data.familyMembers,
      data.places,
      conflicts,
      options.privacyMode,
      data.schoolReadinessTomorrow,
      criticalPrep.items.filter((item) => item.source === "event" || item.source === "school").slice(0, 2),
      carWatch.filter((item) => item.dayLabel === "Tomorrow"),
      tomorrowWeather,
    ),
    schoolReadiness: buildReadinessSummary(
      data.schoolReadinessToday,
      [...todaySchoolActions, ...tomorrowSchoolActions].filter((item) => item.status !== "stale" || item.schoolDate === data.todayKey),
      options.privacyMode,
      "Today",
    ),
    weatherSuggestions: [todayWeather, tomorrowWeather],
    carWatch,
    criticalPrep: criticalPrep.items,
    hiddenPrepCount: criticalPrep.hiddenCount,
    statuses: {
      isOffline: options.isOffline,
      weatherStale: [todayWeather, tomorrowWeather].some((item) => item.status === "stale"),
      weatherConfigured: [todayWeather, tomorrowWeather].some((item) => item.status !== "off" && item.status !== "setup_required"),
      weatherUnavailable: [todayWeather, tomorrowWeather].some((item) => item.status === "unavailable"),
      privacyMode: options.privacyMode,
    },
  };
}

export async function getHubViewModel(options: BuildHubOptions = {}): Promise<HubViewModel> {
  const now = options.now ?? new Date();
  const privacyMode = options.privacyMode ?? false;
  const isOffline = options.isOffline ?? false;
  const todayKey = currentDateKey(now);
  const tomorrowKey = addDaysToDateKey(todayKey, 1);

  const [familyMembers, places, todayEvents, tomorrowEvents, allEvents, prepItems, carItems, schoolCalendar, halfTermConfigs, schoolPrepActions] = await Promise.all([
    getFamilyMembers(),
    getPlaces(),
    getEventsForDate(todayKey),
    getEventsForDate(tomorrowKey),
    getEvents(),
    getPrepTasks(),
    getResourceNeeds(FAMILY_CAR_RESOURCE_ID),
    getSchoolCalendar(),
    listSchoolHalfTermConfigs(),
    listSchoolPrepActionsByRange(todayKey, tomorrowKey),
  ]);

  const schoolReadinessToday = getSchoolReadinessForDate(schoolCalendar, halfTermConfigs, todayKey);
  const schoolReadinessTomorrow = getSchoolReadinessForDate(schoolCalendar, halfTermConfigs, tomorrowKey);
  const weather = await getWeatherSchoolContexts([schoolReadinessToday, schoolReadinessTomorrow]);

  return buildHubViewModel({
    todayKey,
    tomorrowKey,
    familyMembers,
    places,
    todayEvents,
    tomorrowEvents,
    allEvents,
    prepItems,
    carItems,
    schoolReadinessToday,
    schoolReadinessTomorrow,
    weather,
    schoolPrepActions,
  }, { now, privacyMode, isOffline });
}
