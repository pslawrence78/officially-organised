import { describe, expect, it } from "vitest";
import {
  defaultHubWallboardSettings,
  getAvailableHubPanels,
  getHubPanelDwellSeconds,
  getHubRotationStatus,
  getOrderedHubPanels,
  nextHubPanelIndex,
  previousHubPanelIndex,
  reduceHubRotation,
  sanitizeHubWallboardSettings,
  shouldRotate,
} from "./hubRotationService";
import type { HubViewModel } from "./hubService";

function viewModel(overrides: Partial<HubViewModel> = {}): HubViewModel {
  return {
    generatedAt: "2026-06-27T10:00:00.000Z",
    today: { date: "2026-06-27", label: "Today", items: [] },
    tomorrow: { date: "2026-06-28", label: "Tomorrow", items: [] },
    schoolReadiness: {
      date: "2026-06-27",
      heading: "Today",
      schoolStatus: "closed",
      schoolStatusLabel: "Closed",
      warnings: [],
      actions: [],
    },
    weatherSuggestions: [{
      date: "2026-06-27",
      heading: "Today",
      status: "off",
      statusLabel: "Weather off",
      suggestions: [],
    }],
    carWatch: [],
    criticalPrep: [],
    hiddenPrepCount: 0,
    statuses: {
      isOffline: false,
      weatherConfigured: false,
      weatherStale: false,
      weatherUnavailable: false,
      privacyMode: true,
    },
    ...overrides,
  };
}

describe("Hub rotation service", () => {
  it("returns deterministic panel order", () => {
    expect(getOrderedHubPanels().map((item) => item.id)).toEqual(["today", "tomorrow", "school", "weather", "car", "prep"]);
  });

  it("excludes disabled panels", () => {
    expect(getOrderedHubPanels([{ ...getOrderedHubPanels()[0], enabledByDefault: false }])).toEqual([]);
  });

  it("skips unavailable panels when configured", () => {
    expect(getAvailableHubPanels(viewModel(), defaultHubWallboardSettings).map((item) => item.id)).toEqual(["today", "tomorrow"]);
  });

  it("keeps critical panels available when warnings matter", () => {
    const model = viewModel({
      carWatch: [{ id: "car", eventId: "event", eventTitle: "Swimming", dayLabel: "Today", windowLabel: "09:00", needLabel: "Required", allocatedLabel: "Not allocated", conflictTone: "critical", conflictLabel: "Clash" }],
      criticalPrep: [{ id: "prep", source: "event", title: "Pack kit", dueLabel: "Today 09:00", priorityLabel: "Critical", statusLabel: "Open", stateTone: "critical" }],
    });
    expect(getAvailableHubPanels(model, defaultHubWallboardSettings).map((item) => item.id)).toContain("car");
    expect(getAvailableHubPanels(model, defaultHubWallboardSettings).map((item) => item.id)).toContain("prep");
  });

  it("advances after the active panel dwell time", () => {
    const panels = getOrderedHubPanels();
    expect(reduceHubRotation({ panels, activeIndex: 0, elapsedMs: 20_000, settings: defaultHubWallboardSettings })).toBe(1);
  });

  it("uses per-panel dwell time when configured", () => {
    const panels = getOrderedHubPanels();
    expect(shouldRotate({ panels, activeIndex: 0, elapsedMs: 19_000, settings: defaultHubWallboardSettings })).toBe(false);
    expect(shouldRotate({ panels, activeIndex: 1, elapsedMs: 15_000, settings: defaultHubWallboardSettings })).toBe(true);
  });

  it("clamps dwell time to min and max bounds", () => {
    const panels = getOrderedHubPanels();
    expect(getHubPanelDwellSeconds(panels[0], sanitizeHubWallboardSettings({ panelDwellSeconds: { today: 1 } }))).toBe(5);
    expect(getHubPanelDwellSeconds(panels[0], sanitizeHubWallboardSettings({ panelDwellSeconds: { today: 999 } }))).toBe(120);
  });

  it("does not advance when paused", () => {
    const panels = getOrderedHubPanels();
    expect(reduceHubRotation({ panels, activeIndex: 0, elapsedMs: 20_000, settings: defaultHubWallboardSettings, manuallyPaused: true })).toBe(0);
  });

  it("does not advance with zero or one panel", () => {
    expect(reduceHubRotation({ panels: [], activeIndex: 0, elapsedMs: 999_000, settings: defaultHubWallboardSettings })).toBe(0);
    expect(reduceHubRotation({ panels: [getOrderedHubPanels()[0]], activeIndex: 0, elapsedMs: 999_000, settings: defaultHubWallboardSettings })).toBe(0);
  });

  it("manual next and previous wrap correctly", () => {
    expect(nextHubPanelIndex(5, 6)).toBe(0);
    expect(previousHubPanelIndex(0, 6)).toBe(5);
  });

  it("hidden state pauses rotation", () => {
    const panels = getOrderedHubPanels();
    expect(shouldRotate({ panels, activeIndex: 0, elapsedMs: 20_000, settings: defaultHubWallboardSettings, hidden: true })).toBe(false);
  });

  it("visible state resumes only when not manually paused", () => {
    const panels = getOrderedHubPanels();
    expect(shouldRotate({ panels, activeIndex: 0, elapsedMs: 20_000, settings: defaultHubWallboardSettings, hidden: false })).toBe(true);
    expect(shouldRotate({ panels, activeIndex: 0, elapsedMs: 20_000, settings: defaultHubWallboardSettings, hidden: false, manuallyPaused: true })).toBe(false);
  });

  it("reduced-motion preference calms rotation according to settings", () => {
    const panels = getOrderedHubPanels();
    expect(shouldRotate({ panels, activeIndex: 0, elapsedMs: 20_000, settings: defaultHubWallboardSettings, reducedMotion: true })).toBe(false);
    expect(shouldRotate({ panels, activeIndex: 0, elapsedMs: 20_000, settings: sanitizeHubWallboardSettings({ reducedMotionAutoRotate: "allow" }), reducedMotion: true })).toBe(true);
  });

  it("offline state produces a safe display state", () => {
    expect(getHubRotationStatus(defaultHubWallboardSettings, false, false, false, true)).toBe("Offline, showing local data");
  });

  it("unsupported permission paths remain calm statuses", () => {
    expect(getHubRotationStatus(defaultHubWallboardSettings, false, true, false, false)).toBe("Paused while hidden");
    expect(getHubRotationStatus(sanitizeHubWallboardSettings({ reducedMotionAutoRotate: "always-off" }), false, false, true, false)).toBe("Rotation calmed");
  });
});

