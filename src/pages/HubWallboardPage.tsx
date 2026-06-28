import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { getHubRenderedPanels } from "../components/hub/HubPanelRegistry";
import { HubHeartbeat } from "../components/hub/HubHeartbeat";
import { useDocumentHidden } from "../components/hub/useDocumentHidden";
import { useFullscreen } from "../components/hub/useFullscreen";
import { useHubRotation } from "../components/hub/useHubRotation";
import { useReducedMotion } from "../components/hub/useReducedMotion";
import { useWakeLock } from "../components/hub/useWakeLock";
import { getSetting } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { defaultHubWallboardSettings, getHubPanelDwellSeconds, HUB_WALLBOARD_SETTINGS_ID, sanitizeHubWallboardSettings } from "../services/hubRotationService";
import { getHubViewModel } from "../services/hubService";

const PRIVACY_KEY = "officially-organised:hub-privacy-mode";

function formatHubDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(date);
}

function initialPrivacyMode() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(PRIVACY_KEY) !== "off";
}

function initialOfflineState() {
  if (typeof navigator === "undefined") return false;
  return !navigator.onLine;
}

export function HubWallboardPage() {
  const shellRef = useRef<HTMLElement | null>(null);
  const [privacyMode] = useState(initialPrivacyMode);
  const [isOffline, setIsOffline] = useState(initialOfflineState);
  const todayLabel = formatHubDate(new Date());
  const documentHidden = useDocumentHidden();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const state = useRepositoryQuery(async () => {
    const [viewModel, settingsRecord] = await Promise.all([
      getHubViewModel({ isOffline, privacyMode, now: new Date() }),
      getSetting(HUB_WALLBOARD_SETTINGS_ID),
    ]);
    return {
      viewModel,
      settings: sanitizeHubWallboardSettings(settingsRecord?.value ?? defaultHubWallboardSettings),
    };
  }, [isOffline, privacyMode]);

  const panels = state.data ? getHubRenderedPanels(state.data.viewModel, state.data.settings) : [];
  const rotation = useHubRotation({
    panels,
    settings: state.data?.settings ?? defaultHubWallboardSettings,
    documentHidden,
    reducedMotion,
  });
  const fullscreen = useFullscreen(shellRef);
  const wakeLock = useWakeLock(Boolean(state.data?.settings.wakeLockEnabled), documentHidden);
  const currentPanel = panels[rotation.activeIndex % Math.max(panels.length, 1)];
  const dwellSeconds = getHubPanelDwellSeconds(currentPanel, state.data?.settings ?? defaultHubWallboardSettings);

  return (
    <main className="hub-display-shell hub-display-shell--wallboard" aria-label="Household Hub wallboard" ref={shellRef}>
      <p className="hub-portrait-helper" role="note">Rotate device for the best wallboard view. Rotation stays read-only.</p>
      <div className="hub-display-frame">
        <header className="hub-display-topbar hub-wallboard-topbar">
          <div>
            <p className="eyebrow">Lawrence Family Hub</p>
            <h1>Wallboard</h1>
          </div>
          <div className="hub-display-topbar__meta">
            <strong>{todayLabel}</strong>
            <span>{rotation.manualPaused ? "Paused display" : "Rotating household briefing"}</span>
          </div>
          <div className="hub-wallboard-controls" aria-label="Wallboard controls">
            <button className="hub-card-control" onClick={rotation.previous} type="button">Previous</button>
            <button className="hub-card-control" onClick={() => rotation.setPaused(!rotation.manualPaused)} type="button">
              {rotation.manualPaused ? "Resume" : "Pause"}
            </button>
            <button className="hub-card-control" onClick={rotation.next} type="button">Next</button>
            {fullscreen.supported ? (
              <button className="hub-card-control" onClick={fullscreen.isFullscreen ? fullscreen.exit : fullscreen.enter} type="button">
                {fullscreen.isFullscreen ? "Exit full screen" : "Full screen"}
              </button>
            ) : null}
            {wakeLock.supported ? (
              <button className="hub-card-control" disabled={!state.data?.settings.wakeLockEnabled} onClick={wakeLock.active ? wakeLock.release : wakeLock.request} type="button">
                {wakeLock.active ? "Release wake lock" : "Keep awake"}
              </button>
            ) : null}
            <Link className="hub-exit-control" to="/hub">Exit wallboard</Link>
          </div>
        </header>

        {state.loading ? <LoadingState label="Starting the household wallboard..." /> : null}
        {state.error ? <ErrorState>Wallboard data could not be assembled right now. Reload and try again.</ErrorState> : null}
        {state.data ? (
          <>
            <section className="hub-display-stage hub-display-stage--wallboard" aria-live="polite">
              {currentPanel ? (
                <div
                  className="hub-display-card hub-display-card--wallboard"
                  data-card={currentPanel.id}
                  data-paused={rotation.paused ? "true" : "false"}
                >
                  <div className="hub-display-card__label">
                    <span>{currentPanel.title}</span>
                    <strong>{rotation.activeIndex + 1}/{panels.length} &middot; {dwellSeconds}s</strong>
                  </div>
                  {currentPanel.element}
                  {!reducedMotion && state.data.settings.rotationEnabled && panels.length > 1 ? (
                    <div className="hub-dwell-progress" key={`${currentPanel.id}-${rotation.activeIndex}`} style={{ animationDuration: `${dwellSeconds}s` }} />
                  ) : null}
                </div>
              ) : (
                <div className="hub-display-card hub-display-card--wallboard">
                  <div className="hub-display-card__label"><span>Hub</span><strong>Static</strong></div>
                  <section className="hub-panel">
                    <div className="hub-panel__header">
                      <div>
                        <p className="eyebrow">Safe fallback</p>
                        <h2>No wallboard panels are available</h2>
                      </div>
                    </div>
                    <p className="section-empty-copy">The Hub is still read-only and showing a calm fallback rather than rotating through empty panels.</p>
                  </section>
                </div>
              )}
            </section>
            {fullscreen.message || wakeLock.message ? <p className="hub-wallboard-message" role="status">{fullscreen.message || wakeLock.message}</p> : null}
            <HubHeartbeat
              hidden={documentHidden}
              manuallyPaused={rotation.manualPaused}
              reducedMotion={reducedMotion}
              settings={state.data.settings}
              viewModel={state.data.viewModel}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
