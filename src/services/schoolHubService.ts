import {
  getSchoolCalendar,
  listOpenSchoolPrepActionsByRange,
  listSchoolHalfTermConfigs,
} from "../data/repositories";
import type { SchoolReadinessForDate, SchoolReadinessPrepAction } from "../domain/types";
import type { WeatherSchoolContext } from "../types/weather";
import { addDaysToDateKey, currentDateKey, formatLongDate } from "../utils/dates";
import { getSchoolReadinessForRange } from "./schoolReadinessService";
import { upsertSchoolReadinessPrepActionsForRange } from "./schoolReadinessPrepActionService";
import { getWeatherSchoolContexts } from "./weatherService";

export interface SchoolHubDaySummary {
  date: string;
  label: string;
  schoolStatus: "open" | "closed" | "unknown";
  schoolStatusLabel: string;
  lunchStatus: "known" | "missing" | "not_applicable" | "unknown";
  lunchLabel: string;
  lunchChoice?: string;
  attireStatus: "known" | "missing" | "not_applicable" | "unknown";
  attireLabel: string;
  forestSchoolStatus: "required" | "not_required" | "missing" | "not_applicable" | "unknown";
  forestSchoolLabel: string;
  weatherSuggestionCount: number;
  weatherSuggestionLabels: string[];
  weatherStatus: WeatherSchoolContext["status"];
  openActionCount: number;
  criticalActionCount: number;
  setupGapCount: number;
}

export interface SchoolHubLink {
  id: string;
  label: string;
  to: string;
  description: string;
}

export interface SchoolHubSetupGap {
  id: string;
  date?: string;
  title: string;
  detail: string;
  severity: "info" | "warning";
  link: SchoolHubLink;
}

export interface SchoolHubWeatherSummary {
  enabled: boolean;
  status: WeatherSchoolContext["status"];
  title: string;
  detail: string;
  locationLabel?: string;
  freshnessLabel?: string;
  todaySuggestions: string[];
  tomorrowSuggestions: string[];
  link: SchoolHubLink;
}

export interface SchoolHubViewModel {
  generatedAt: string;
  today: SchoolHubDaySummary;
  tomorrow: SchoolHubDaySummary;
  upcomingDays: SchoolHubDaySummary[];
  openActions: SchoolReadinessPrepAction[];
  setupGaps: SchoolHubSetupGap[];
  weather: SchoolHubWeatherSummary;
  links: SchoolHubLink[];
}

interface BuildSchoolHubViewModelInput {
  generatedAt?: string;
  readiness: SchoolReadinessForDate[];
  weatherByDate: Record<string, WeatherSchoolContext>;
  actions: SchoolReadinessPrepAction[];
}

const UPCOMING_DAY_COUNT = 7;

const SCHOOL_LINKS: SchoolHubLink[] = [
  { id: "school-calendar", label: "School calendar", to: "/settings/school-calendar", description: "Term dates, holidays and closure days." },
  { id: "school-half-terms", label: "Half-term requirements", to: "/settings/school-half-terms", description: "Lunch, PE, uniform and Forest School by date." },
  { id: "school-weather", label: "Weather settings", to: "/settings", description: "Optional weather-aware school suggestions." },
  { id: "school-prep", label: "Prep page", to: "/prep", description: "Open school and weather-derived preparation actions." },
];

function buildDaySummary(readiness: SchoolReadinessForDate, weather: WeatherSchoolContext, actions: SchoolReadinessPrepAction[], gaps: SchoolHubSetupGap[]): SchoolHubDaySummary {
  const openActions = actions.filter((item) => item.status === "open");
  const schoolClosed = readiness.schoolStatus === "closed";
  const schoolUnknown = readiness.schoolStatus === "unknown";
  const forestRequired = readiness.forestSchool.required;

  return {
    date: readiness.date,
    label: formatLongDate(readiness.date),
    schoolStatus: readiness.schoolStatus,
    schoolStatusLabel: readiness.schoolStatusLabel,
    lunchStatus: schoolClosed ? "not_applicable" : readiness.hasConfiguration ? (readiness.lunch.isKnown ? "known" : "missing") : schoolUnknown ? "unknown" : "missing",
    lunchLabel: schoolClosed ? "Not applicable" : readiness.hasConfiguration ? readiness.lunch.choice ? `${readiness.lunch.label} - ${readiness.lunch.choice}` : readiness.lunch.label : schoolUnknown ? "Check school calendar setup" : "Not configured",
    lunchChoice: readiness.lunch.choice,
    attireStatus: schoolClosed ? "not_applicable" : readiness.hasConfiguration ? (readiness.attire.isKnown ? "known" : "missing") : schoolUnknown ? "unknown" : "missing",
    attireLabel: schoolClosed ? "Not applicable" : readiness.hasConfiguration ? readiness.attire.label : schoolUnknown ? "Check school calendar setup" : "Not configured",
    forestSchoolStatus: schoolClosed ? "not_applicable" : !readiness.hasConfiguration ? (schoolUnknown ? "unknown" : "missing") : forestRequired ? "required" : "not_required",
    forestSchoolLabel: schoolClosed
      ? "Not applicable"
      : !readiness.hasConfiguration
        ? schoolUnknown ? "Check school calendar setup" : "Not configured"
        : forestRequired
          ? [
            "Forest School required",
            readiness.forestSchool.wellingtonBoots ? "Wellies" : null,
            readiness.forestSchool.longTrousers ? "Long trousers" : null,
            readiness.forestSchool.waterproofs ? "Waterproofs" : null,
          ].filter(Boolean).join(" - ")
          : "Not required",
    weatherSuggestionCount: weather.suggestions.length,
    weatherSuggestionLabels: weather.suggestions.map((item) => item.title),
    weatherStatus: weather.status,
    openActionCount: openActions.length,
    criticalActionCount: openActions.filter((item) => item.priority === "critical" || item.blocksSchoolReadiness).length,
    setupGapCount: gaps.length,
  };
}

function buildUpcomingGapList(readiness: SchoolReadinessForDate[], weatherByDate: Record<string, WeatherSchoolContext>) {
  const gaps: SchoolHubSetupGap[] = [];

  for (const item of readiness) {
    if (item.schoolStatus === "closed") continue;

    if (item.schoolStatus === "unknown") {
      gaps.push({
        id: `gap-status-${item.date}`,
        date: item.date,
        title: "School status unknown",
        detail: `${formatLongDate(item.date)} is outside the known school calendar. Check term dates or closure days.`,
        severity: "info",
        link: SCHOOL_LINKS[0],
      });
      continue;
    }

    if (!item.hasConfiguration) {
      gaps.push({
        id: `gap-config-${item.date}`,
        date: item.date,
        title: "School requirements missing",
        detail: `${formatLongDate(item.date)} has no half-term requirements loaded yet.`,
        severity: "warning",
        link: SCHOOL_LINKS[1],
      });
      continue;
    }

    if (!item.lunch.isKnown) {
      gaps.push({
        id: `gap-lunch-${item.date}`,
        date: item.date,
        title: "Lunch still unknown",
        detail: `${formatLongDate(item.date)} needs a lunch choice.`,
        severity: "warning",
        link: SCHOOL_LINKS[1],
      });
    }

    if (!item.attire.isKnown) {
      gaps.push({
        id: `gap-attire-${item.date}`,
        date: item.date,
        title: "PE / uniform still unknown",
        detail: `${formatLongDate(item.date)} needs a clothing requirement.`,
        severity: "warning",
        link: SCHOOL_LINKS[1],
      });
    }

    const weather = weatherByDate[item.date];
    if (weather?.status === "stale") {
      gaps.push({
        id: `gap-weather-${item.date}`,
        date: item.date,
        title: "Weather forecast is stale",
        detail: `${formatLongDate(item.date)} is using an older forecast. School readiness still works without it.`,
        severity: "info",
        link: SCHOOL_LINKS[2],
      });
    }
  }

  return gaps;
}

function buildWeatherSummary(today: WeatherSchoolContext, tomorrow: WeatherSchoolContext): SchoolHubWeatherSummary {
  const enabled = today.settings.enabled;
  if (!enabled) {
    return {
      enabled,
      status: "off",
      title: "Weather-aware school suggestions are off",
      detail: "School readiness still works normally without weather.",
      todaySuggestions: [],
      tomorrowSuggestions: [],
      link: SCHOOL_LINKS[2],
    };
  }

  if (today.status === "setup_required") {
    return {
      enabled,
      status: "setup_required",
      title: "Weather setup needed",
      detail: "Add coarse coordinates in Settings to use school weather suggestions.",
      todaySuggestions: [],
      tomorrowSuggestions: [],
      link: SCHOOL_LINKS[2],
    };
  }

  const status = [today.status, tomorrow.status].includes("stale")
    ? "stale"
    : [today.status, tomorrow.status].includes("unavailable")
      ? "unavailable"
      : "fresh";

  return {
    enabled,
    status,
    title: status === "stale" ? "Weather suggestions are available but stale" : status === "unavailable" ? "Weather suggestions unavailable" : "Weather suggestions ready",
    detail: status === "fresh" ? "Optional weather checks for today and tomorrow." : status === "stale" ? "An older forecast is available. School readiness still works as normal." : "School readiness still works as normal without the forecast.",
    locationLabel: today.settings.locationLabel,
    freshnessLabel: today.snapshot ? `Last updated ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(today.snapshot.fetchedAt))}` : undefined,
    todaySuggestions: today.suggestions.map((item) => item.title),
    tomorrowSuggestions: tomorrow.suggestions.map((item) => item.title),
    link: SCHOOL_LINKS[2],
  };
}

export function buildSchoolHubViewModel(input: BuildSchoolHubViewModelInput): SchoolHubViewModel {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const readiness = [...input.readiness].sort((left, right) => left.date.localeCompare(right.date));
  const setupGaps = buildUpcomingGapList(readiness, input.weatherByDate);
  const actions = [...input.actions]
    .filter((item) => item.status === "open")
    .sort((left, right) => left.schoolDate.localeCompare(right.schoolDate) || left.dueAt.localeCompare(right.dueAt) || left.title.localeCompare(right.title));

  const todayReadiness = readiness[0];
  const tomorrowReadiness = readiness[1];
  const todayWeather = input.weatherByDate[todayReadiness.date];
  const tomorrowWeather = input.weatherByDate[tomorrowReadiness.date];
  const dayGaps = (date: string) => setupGaps.filter((gap) => gap.date === date);
  const dayActions = (date: string) => actions.filter((item) => item.schoolDate === date);

  return {
    generatedAt,
    today: buildDaySummary(todayReadiness, todayWeather, dayActions(todayReadiness.date), dayGaps(todayReadiness.date)),
    tomorrow: buildDaySummary(tomorrowReadiness, tomorrowWeather, dayActions(tomorrowReadiness.date), dayGaps(tomorrowReadiness.date)),
    upcomingDays: readiness.map((item) => buildDaySummary(item, input.weatherByDate[item.date], dayActions(item.date), dayGaps(item.date))),
    openActions: actions,
    setupGaps,
    weather: buildWeatherSummary(todayWeather, tomorrowWeather),
    links: SCHOOL_LINKS,
  };
}

export async function getSchoolHubViewModel(options: { now?: Date } = {}): Promise<SchoolHubViewModel> {
  const now = options.now ?? new Date();
  const today = currentDateKey(now);
  const end = addDaysToDateKey(today, UPCOMING_DAY_COUNT - 1);
  const [calendar, configs] = await Promise.all([getSchoolCalendar(), listSchoolHalfTermConfigs()]);
  const readiness = getSchoolReadinessForRange(calendar, configs, today, end);
  const weatherByDate = await getWeatherSchoolContexts(readiness);
  await upsertSchoolReadinessPrepActionsForRange(readiness, Object.fromEntries(Object.entries(weatherByDate).map(([date, context]) => [date, context.suggestions])));
  const openActions = await listOpenSchoolPrepActionsByRange(today, end);
  return buildSchoolHubViewModel({ generatedAt: now.toISOString(), readiness, weatherByDate, actions: openActions });
}
