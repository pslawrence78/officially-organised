import type { HubViewModel } from "../services/hubService";

export type HubPanelId = "today" | "tomorrow" | "school" | "weather" | "car" | "prep";

export type HubReducedMotionAutoRotate = "respect-system" | "always-off" | "allow";

export interface HubWallboardSettings {
  rotationEnabled: boolean;
  defaultDwellSeconds: number;
  panelDwellSeconds: Partial<Record<HubPanelId, number>>;
  skipEmptyPanels: boolean;
  wakeLockEnabled: boolean;
  reducedMotionAutoRotate: HubReducedMotionAutoRotate;
}

export interface HubPanelDescriptor {
  id: HubPanelId;
  title: string;
  description?: string;
  enabledByDefault: boolean;
  defaultDwellSeconds: number;
  minimumDwellSeconds: number;
  maximumDwellSeconds: number;
  priority: number;
  isAvailable?: (viewModel: HubViewModel, settings: HubWallboardSettings) => boolean;
}

export interface HubRotationRuntimeState {
  activeIndex: number;
  lastAdvancedAt: number;
  manuallyPaused: boolean;
  hidden: boolean;
  offline: boolean;
  reducedMotion: boolean;
}

export interface HubRotationDecisionInput {
  panels: HubPanelDescriptor[];
  activeIndex: number;
  elapsedMs: number;
  settings: HubWallboardSettings;
  manuallyPaused?: boolean;
  hidden?: boolean;
  reducedMotion?: boolean;
}

