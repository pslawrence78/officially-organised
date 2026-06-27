import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [privacyMode] = useState(initialPrivacyMode);
  const [isOffline, setIsOffline] = useState(initialOfflineState);
  const [activeCard, setActiveCard] = useState(0);

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
    [isOffline, privacyMode],
  );

  const cards = state.data ? [
    {
      id: "today",
      label: "Today",
      element: <HubDayPanel day={state.data.today} eyebrow="Today" title="At a glance" />,
    },
    {
      id: "tomorrow",
      label: "Tomorrow",
      element: <HubDayPanel day={state.data.tomorrow} eyebrow="Tomorrow" title="Coming next" />,
    },
    {
      id: "school",
      label: "School",
      element: <HubSchoolReadinessPanel readiness={state.data.schoolReadiness} />,
    },
    {
      id: "weather",
      label: "Weather",
      element: <HubWeatherSuggestionsPanel items={state.data.weatherSuggestions} />,
    },
    {
      id: "car",
      label: "Car",
      element: <HubCarWatchPanel items={state.data.carWatch} />,
    },
    {
      id: "prep",
      label: "Prep",
      element: <HubCriticalPrepPanel hiddenCount={state.data.hiddenPrepCount} items={state.data.criticalPrep} />,
    },
  ] : [];
  const currentCard = cards[activeCard % Math.max(cards.length, 1)];
  const goPrevious = () => setActiveCard((value) => (value + cards.length - 1) % cards.length);
  const goNext = () => setActiveCard((value) => (value + 1) % cards.length);

  return (
    <main className="hub-display-shell" aria-label="Household Hub display">
      <header className="hub-display-topbar">
        <div>
          <p className="eyebrow">Household display</p>
          <h1>Hub</h1>
        </div>
        <Link className="hub-exit-control" to="/">Exit dashboard</Link>
      </header>

      {state.loading ? <LoadingState label="Refreshing the household Hub..." /> : null}
      {state.error ? <ErrorState>Hub data could not be assembled right now. Reload and try again.</ErrorState> : null}
      {state.data ? (
        <>
          <section className="hub-display-stage" aria-live="polite">
            <button aria-label="Previous card" className="hub-card-control hub-card-control--previous" onClick={goPrevious} type="button">
              Previous
            </button>
            <div className="hub-display-card" data-card={currentCard.id}>
              <div className="hub-display-card__label">
                <span>{currentCard.label}</span>
                <strong>{activeCard + 1}/{cards.length}</strong>
              </div>
              {currentCard.element}
            </div>
            <button aria-label="Next card" className="hub-card-control hub-card-control--next" onClick={goNext} type="button">
              Next
            </button>
          </section>
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
    </main>
  );
}
