import type {
  HubPanelDescriptor,
  HubPanelId,
  HubRotationDecisionInput,
  HubWallboardSettings,
} from "../types/hubRotation";
import type { HubViewModel } from "./hubService";

export const HUB_WALLBOARD_SETTINGS_ID = "hub_wallboard_settings";
export const HUB_DEFAULT_DWELL_SECONDS = 15;
export const HUB_MIN_DWELL_SECONDS = 5;
export const HUB_MAX_DWELL_SECONDS = 120;

export const defaultHubWallboardSettings: HubWallboardSettings = {
  rotationEnabled: true,
  defaultDwellSeconds: HUB_DEFAULT_DWELL_SECONDS,
  panelDwellSeconds: {
    today: 20,
    tomorrow: 15,
    school: 20,
    weather: 15,
    car: 20,
    prep: 20,
  },
  skipEmptyPanels: true,
  wakeLockEnabled: false,
  reducedMotionAutoRotate: "respect-system",
};

export const hubPanelDescriptors: HubPanelDescriptor[] = [
  {
    id: "today",
    title: "Today",
    description: "Current household events and warnings.",
    enabledByDefault: true,
    defaultDwellSeconds: 20,
    minimumDwellSeconds: HUB_MIN_DWELL_SECONDS,
    maximumDwellSeconds: HUB_MAX_DWELL_SECONDS,
    priority: 10,
  },
  {
    id: "tomorrow",
    title: "Tomorrow",
    description: "Next-day household preview.",
    enabledByDefault: true,
    defaultDwellSeconds: 15,
    minimumDwellSeconds: HUB_MIN_DWELL_SECONDS,
    maximumDwellSeconds: HUB_MAX_DWELL_SECONDS,
    priority: 20,
  },
  {
    id: "school",
    title: "School",
    description: "School readiness and projected prep.",
    enabledByDefault: true,
    defaultDwellSeconds: 20,
    minimumDwellSeconds: HUB_MIN_DWELL_SECONDS,
    maximumDwellSeconds: HUB_MAX_DWELL_SECONDS,
    priority: 30,
    isAvailable: (viewModel) => viewModel.schoolReadiness.schoolStatus !== "closed" || viewModel.schoolReadiness.warnings.length > 0 || viewModel.schoolReadiness.actions.length > 0,
  },
  {
    id: "weather",
    title: "Weather",
    description: "Weather-aware school suggestions.",
    enabledByDefault: true,
    defaultDwellSeconds: 15,
    minimumDwellSeconds: HUB_MIN_DWELL_SECONDS,
    maximumDwellSeconds: HUB_MAX_DWELL_SECONDS,
    priority: 40,
    isAvailable: (viewModel, settings) => {
      if (!settings.skipEmptyPanels) return true;
      return viewModel.weatherSuggestions.some((item) => item.suggestions.length > 0 || item.status === "stale" || item.status === "unavailable");
    },
  },
  {
    id: "car",
    title: "Car",
    description: "Shared family car watch.",
    enabledByDefault: true,
    defaultDwellSeconds: 20,
    minimumDwellSeconds: HUB_MIN_DWELL_SECONDS,
    maximumDwellSeconds: HUB_MAX_DWELL_SECONDS,
    priority: 50,
    isAvailable: (viewModel, settings) => {
      if (viewModel.carWatch.some((item) => item.conflictTone === "critical")) return true;
      return !settings.skipEmptyPanels || viewModel.carWatch.length > 0;
    },
  },
  {
    id: "prep",
    title: "Prep",
    description: "Critical and near-term preparation.",
    enabledByDefault: true,
    defaultDwellSeconds: 20,
    minimumDwellSeconds: HUB_MIN_DWELL_SECONDS,
    maximumDwellSeconds: HUB_MAX_DWELL_SECONDS,
    priority: 60,
    isAvailable: (viewModel, settings) => {
      if (viewModel.criticalPrep.some((item) => item.stateTone === "critical")) return true;
      return !settings.skipEmptyPanels || viewModel.criticalPrep.length > 0 || viewModel.hiddenPrepCount > 0;
    },
  },
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberInRange(value: unknown, fallback: number, min = HUB_MIN_DWELL_SECONDS, max = HUB_MAX_DWELL_SECONDS) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

export function sanitizeHubWallboardSettings(value: unknown): HubWallboardSettings {
  if (!isObject(value)) return defaultHubWallboardSettings;
  const panelDwellSeconds: Partial<Record<HubPanelId, number>> = {};
  const sourcePanelDwell = isObject(value.panelDwellSeconds) ? value.panelDwellSeconds : {};
  for (const descriptor of hubPanelDescriptors) {
    const dwell = sourcePanelDwell[descriptor.id];
    if (typeof dwell === "number") {
      panelDwellSeconds[descriptor.id] = numberInRange(dwell, descriptor.defaultDwellSeconds, descriptor.minimumDwellSeconds, descriptor.maximumDwellSeconds);
    }
  }
  const reducedMotionAutoRotate = value.reducedMotionAutoRotate === "always-off" || value.reducedMotionAutoRotate === "allow"
    ? value.reducedMotionAutoRotate
    : "respect-system";
  return {
    rotationEnabled: typeof value.rotationEnabled === "boolean" ? value.rotationEnabled : defaultHubWallboardSettings.rotationEnabled,
    defaultDwellSeconds: numberInRange(value.defaultDwellSeconds, defaultHubWallboardSettings.defaultDwellSeconds),
    panelDwellSeconds: { ...defaultHubWallboardSettings.panelDwellSeconds, ...panelDwellSeconds },
    skipEmptyPanels: typeof value.skipEmptyPanels === "boolean" ? value.skipEmptyPanels : defaultHubWallboardSettings.skipEmptyPanels,
    wakeLockEnabled: typeof value.wakeLockEnabled === "boolean" ? value.wakeLockEnabled : defaultHubWallboardSettings.wakeLockEnabled,
    reducedMotionAutoRotate,
  };
}

export function getOrderedHubPanels(items: HubPanelDescriptor[] = hubPanelDescriptors) {
  return [...items].filter((item) => item.enabledByDefault).sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

export function getAvailableHubPanels(viewModel: HubViewModel, settings: HubWallboardSettings, items: HubPanelDescriptor[] = hubPanelDescriptors) {
  return getOrderedHubPanels(items).filter((item) => item.isAvailable?.(viewModel, settings) ?? true);
}

export function getHubPanelDwellSeconds(panel: HubPanelDescriptor | undefined, settings: HubWallboardSettings) {
  if (!panel) return settings.defaultDwellSeconds;
  const requested = settings.panelDwellSeconds[panel.id] ?? settings.defaultDwellSeconds ?? panel.defaultDwellSeconds;
  return numberInRange(requested, panel.defaultDwellSeconds, panel.minimumDwellSeconds, panel.maximumDwellSeconds);
}

export function shouldRotate(input: HubRotationDecisionInput) {
  if (!input.settings.rotationEnabled) return false;
  if (input.manuallyPaused || input.hidden) return false;
  if (input.reducedMotion && input.settings.reducedMotionAutoRotate !== "allow") return false;
  if (input.panels.length <= 1) return false;
  const activePanel = input.panels[input.activeIndex % input.panels.length];
  return input.elapsedMs >= getHubPanelDwellSeconds(activePanel, input.settings) * 1000;
}

export function nextHubPanelIndex(currentIndex: number, panelCount: number) {
  return panelCount <= 0 ? 0 : (currentIndex + 1) % panelCount;
}

export function previousHubPanelIndex(currentIndex: number, panelCount: number) {
  return panelCount <= 0 ? 0 : (currentIndex + panelCount - 1) % panelCount;
}

export function reduceHubRotation(input: HubRotationDecisionInput) {
  return shouldRotate(input) ? nextHubPanelIndex(input.activeIndex, input.panels.length) : input.activeIndex;
}

export function getHubRotationStatus(settings: HubWallboardSettings, manuallyPaused: boolean, hidden: boolean, reducedMotion: boolean, offline: boolean) {
  if (manuallyPaused) return "Rotation paused";
  if (hidden) return "Paused while hidden";
  if (reducedMotion && settings.reducedMotionAutoRotate !== "allow") return "Rotation calmed";
  if (!settings.rotationEnabled) return "Rotation off";
  if (offline) return "Offline, showing local data";
  return "Rotation running";
}

