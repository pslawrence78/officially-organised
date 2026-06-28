import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { getHubRenderedPanels } from "../components/hub/HubPanelRegistry";
import { HubStatusFooter } from "../components/hub/HubStatusFooter";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { defaultHubWallboardSettings, HUB_WALLBOARD_SETTINGS_ID, sanitizeHubWallboardSettings } from "../services/hubRotationService";
import { getHubViewModel } from "../services/hubService";
import { getSetting } from "../data/repositories";

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

export function HubPage() {
  const [privacyMode] = useState(initialPrivacyMode);
  const [isOffline, setIsOffline] = useState(initialOfflineState);
  const [activeCard, setActiveCard] = useState(0);
  const todayLabel = formatHubDate(new Date());

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
    async () => {
      const [viewModel, settingsRecord] = await Promise.all([
        getHubViewModel({ isOffline, privacyMode, now: new Date() }),
        getSetting(HUB_WALLBOARD_SETTINGS_ID),
      ]);
      return {
        viewModel,
        settings: sanitizeHubWallboardSettings(settingsRecord?.value ?? defaultHubWallboardSettings),
      };
    },
    [isOffline, privacyMode],
  );

  const cards = state.data ? getHubRenderedPanels(state.data.viewModel, state.data.settings, true) : [];
  const currentCard = cards[activeCard % Math.max(cards.length, 1)];
  const goPrevious = () => setActiveCard((value) => (value + cards.length - 1) % cards.length);
  const goNext = () => setActiveCard((value) => (value + 1) % cards.length);

  return (
    <main className="hub-display-shell" aria-label="Household Hub display">
      <p className="hub-portrait-helper" role="note">Rotate device for the best Hub view. The display remains read-only.</p>
      <div className="hub-display-frame">
        <header className="hub-display-topbar">
          <div>
            <p className="eyebrow">Lawrence Family Hub</p>
            <h1>Officially Organised</h1>
          </div>
          <div className="hub-display-topbar__meta">
            <strong>{todayLabel}</strong>
            <span>Today at a glance</span>
          </div>
          <div className="hub-wallboard-controls">
            <Link className="hub-exit-control" to="/hub/wallboard">Wallboard</Link>
            <Link className="hub-exit-control" to="/">Exit dashboard</Link>
          </div>
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
                  <span>{currentCard.title}</span>
                  <strong>{activeCard + 1}/{cards.length}</strong>
                </div>
                {currentCard.element}
              </div>
              <button aria-label="Next card" className="hub-card-control hub-card-control--next" onClick={goNext} type="button">
                Next
              </button>
            </section>
            <HubStatusFooter
              generatedAt={state.data.viewModel.generatedAt}
              isOffline={state.data.viewModel.statuses.isOffline}
              privacyMode={state.data.viewModel.statuses.privacyMode}
              weatherConfigured={state.data.viewModel.statuses.weatherConfigured}
              weatherStale={state.data.viewModel.statuses.weatherStale}
              weatherUnavailable={state.data.viewModel.statuses.weatherUnavailable}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
