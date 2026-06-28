import type { ReactNode } from "react";
import { hubPanelDescriptors, getAvailableHubPanels } from "../../services/hubRotationService";
import type { HubViewModel } from "../../services/hubService";
import type { HubPanelDescriptor, HubPanelId, HubWallboardSettings } from "../../types/hubRotation";
import { HubCarWatchPanel } from "./HubCarWatchPanel";
import { HubCriticalPrepPanel } from "./HubCriticalPrepPanel";
import { HubDayPanel } from "./HubDayPanel";
import { HubSchoolReadinessPanel } from "./HubSchoolReadinessPanel";
import { HubWeatherSuggestionsPanel } from "./HubWeatherSuggestionsPanel";

export interface HubRenderedPanel extends HubPanelDescriptor {
  element: ReactNode;
}

function renderPanel(id: HubPanelId, viewModel: HubViewModel) {
  switch (id) {
    case "today":
      return <HubDayPanel day={viewModel.today} eyebrow="Today briefing" title="At a glance" />;
    case "tomorrow":
      return <HubDayPanel day={viewModel.tomorrow} eyebrow="Tomorrow readiness" title="Coming next" />;
    case "school":
      return <HubSchoolReadinessPanel readiness={viewModel.schoolReadiness} />;
    case "weather":
      return <HubWeatherSuggestionsPanel items={viewModel.weatherSuggestions} />;
    case "car":
      return <HubCarWatchPanel items={viewModel.carWatch} />;
    case "prep":
      return <HubCriticalPrepPanel hiddenCount={viewModel.hiddenPrepCount} items={viewModel.criticalPrep} />;
  }
}

export function getHubRenderedPanels(viewModel: HubViewModel, settings: HubWallboardSettings, includeUnavailable = false): HubRenderedPanel[] {
  const descriptors = includeUnavailable ? hubPanelDescriptors : getAvailableHubPanels(viewModel, settings);
  return descriptors.map((item) => ({ ...item, element: renderPanel(item.id, viewModel) }));
}
