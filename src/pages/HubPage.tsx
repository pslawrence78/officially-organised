import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { HubCarWatchPanel } from "../components/hub/HubCarWatchPanel";
import { HubCriticalPrepPanel } from "../components/hub/HubCriticalPrepPanel";
import { HubDayPanel } from "../components/hub/HubDayPanel";
import { HubSchoolReadinessPanel } from "../components/hub/HubSchoolReadinessPanel";
import { HubStatusFooter } from "../components/hub/HubStatusFooter";
import { HubWeatherSuggestionsPanel } from "../components/hub/HubWeatherSuggestionsPanel";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { getHubViewModel } from "../services/hubService";

const PRIVACY_KEY = "officially-organised:hub-privacy-mode";

function initialPrivacyMode() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(PRIVACY_KEY) !== "off";
}

function initialOfflineState() {
  if (typeof navigator === "undefined") return false;
  return !navigator.onLine;
}

export function HubPage() {
  const [privacyMode, setPrivacyMode] = useState(initialPrivacyMode);
  const [isOffline, setIsOffline] = useState(initialOfflineState);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(PRIVACY_KEY, privacyMode ? "on" : "off");
  }, [privacyMode]);

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

  const state = useRepositoryQuery(
    () => getHubViewModel({ isOffline, privacyMode, now: new Date() }),
    [isOffline, privacyMode, refreshVersion],
  );

  return (
    <div className="page-stack hub-page">
      <section className="hub-hero">
        <div>
          <p className="eyebrow">Household display</p>
          <h1>Hub</h1>
          <p>A calm read-only view for a kitchen screen, family tablet, or quick check-in across the day.</p>
        </div>
        <div className="hub-hero__actions">
          <button className="menu-button" onClick={() => setRefreshVersion((value) => value + 1)} type="button">
            <span>Refresh</span>
          </button>
          <button
            aria-pressed={privacyMode}
            className={`hub-privacy-toggle${privacyMode ? " is-on" : ""}`}
            onClick={() => setPrivacyMode((value) => !value)}
            type="button"
          >
            <span>Privacy</span>
            <strong>{privacyMode ? "On" : "Off"}</strong>
          </button>
        </div>
      </section>

      {state.loading ? <LoadingState label="Refreshing the household Hub..." /> : null}
      {state.error ? <ErrorState>Hub data could not be assembled right now. Reload and try again.</ErrorState> : null}
      {state.data ? (
        <>
          <div className="hub-grid">
            <HubDayPanel actionLabel="Today" actionTo="/today" day={state.data.today} eyebrow="Today" title="At a glance" />
            <HubDayPanel actionLabel="Week" actionTo="/week" day={state.data.tomorrow} eyebrow="Tomorrow" title="Coming next" />
            <HubSchoolReadinessPanel readiness={state.data.schoolReadiness} />
            <HubWeatherSuggestionsPanel items={state.data.weatherSuggestions} />
            <HubCarWatchPanel items={state.data.carWatch} />
            <HubCriticalPrepPanel hiddenCount={state.data.hiddenPrepCount} items={state.data.criticalPrep} />
          </div>
          <HubStatusFooter
            generatedAt={state.data.generatedAt}
            isOffline={state.data.statuses.isOffline}
            privacyMode={state.data.statuses.privacyMode}
            weatherConfigured={state.data.statuses.weatherConfigured}
            weatherStale={state.data.statuses.weatherStale}
            weatherUnavailable={state.data.statuses.weatherUnavailable}
          />
        </>
      ) : null}
    </div>
  );
}
