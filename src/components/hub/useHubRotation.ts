import { useEffect, useMemo, useState } from "react";
import {
  getHubPanelDwellSeconds,
  nextHubPanelIndex,
  previousHubPanelIndex,
  shouldRotate,
} from "../../services/hubRotationService";
import type { HubPanelDescriptor, HubWallboardSettings } from "../../types/hubRotation";

export function useHubRotation({
  panels,
  settings,
  documentHidden,
  reducedMotion,
}: {
  panels: HubPanelDescriptor[];
  settings: HubWallboardSettings;
  documentHidden: boolean;
  reducedMotion: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const activePanel = panels[activeIndex % Math.max(panels.length, 1)];
  const dwellSeconds = getHubPanelDwellSeconds(activePanel, settings);
  const paused = manualPaused || interactionPaused || documentHidden || (reducedMotion && settings.reducedMotionAutoRotate !== "allow") || !settings.rotationEnabled;

  useEffect(() => {
    if (activeIndex >= panels.length) setActiveIndex(0);
  }, [activeIndex, panels.length]);

  useEffect(() => {
    if (!shouldRotate({
      panels,
      activeIndex,
      elapsedMs: dwellSeconds * 1000,
      settings,
      manuallyPaused: manualPaused || interactionPaused,
      hidden: documentHidden,
      reducedMotion,
    })) return undefined;
    const timer = window.setTimeout(() => {
      setActiveIndex((value) => nextHubPanelIndex(value, panels.length));
    }, dwellSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, documentHidden, dwellSeconds, interactionPaused, manualPaused, panels, reducedMotion, settings]);

  const pauseForInteraction = () => {
    if (manualPaused) return;
    setInteractionPaused(true);
    window.setTimeout(() => setInteractionPaused(false), 8000);
  };

  return useMemo(() => ({
    activeIndex,
    activePanel,
    dwellSeconds,
    paused,
    manualPaused,
    setPaused: setManualPaused,
    reset: () => setActiveIndex(0),
    next: () => {
      pauseForInteraction();
      setActiveIndex((value) => nextHubPanelIndex(value, panels.length));
    },
    previous: () => {
      pauseForInteraction();
      setActiveIndex((value) => previousHubPanelIndex(value, panels.length));
    },
  }), [activeIndex, activePanel, dwellSeconds, manualPaused, panels.length, paused]);
}

