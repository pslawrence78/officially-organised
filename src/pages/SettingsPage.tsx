import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { PageHeader } from "../components/layout/PageHeader";
import { HubWallboardSettingsPanel } from "../components/hub/HubWallboardSettingsPanel";
import { SyncSettingsPanel } from "../components/sync/SyncSettingsPanel";
import { WeatherSettingsPanel } from "../components/weather/WeatherSettingsPanel";
import { databaseMetadata } from "../data/db";
import { getHousehold } from "../data/repositories";
import { EXPORT_DATA_SCHEMA } from "../domain/constants";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { getLocalDataSummary, resetLocalDataAndReseed } from "../services/importExportService";

const RESET_PHRASE = "RESET OFFICIALLY ORGANISED";

export function SettingsPage() {
  const [phrase, setPhrase] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const state = useRepositoryQuery(async () => {
    const [household, counts] = await Promise.all([getHousehold(), getLocalDataSummary()]);
    return { household, counts };
  }, [resetDone]);

  const reset = async () => {
    if (phrase !== RESET_PHRASE) return;
    setResetting(true);
    await resetLocalDataAndReseed();
    setPhrase("");
    setResetDone(true);
    setResetting(false);
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="The foundations" title="Settings">
        Household and local data details for this installation.
      </PageHeader>

      {state.loading ? <LoadingState /> : null}
      {state.error ? <ErrorState /> : null}

      {state.data ? (
        <section className="settings-card">
          <dl>
            <div><dt>Household</dt><dd>{state.data.household?.name ?? "Not available"}</dd></div>
            <div><dt>Timezone</dt><dd>{state.data.household?.timezone ?? "Not available"}</dd></div>
            <div><dt>Local records</dt><dd>{Object.values(state.data.counts).reduce((sum, count) => sum + count, 0)}</dd></div>
            <div><dt>Database version</dt><dd>{databaseMetadata.schemaVersion}</dd></div>
            <div><dt>Backup schema</dt><dd><code>{EXPORT_DATA_SCHEMA}</code></dd></div>
          </dl>
        </section>
      ) : null}

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Local data safety</p>
            <h2>Backup, restore and reset</h2>
          </div>
        </div>
        <div className="settings-links" aria-label="Local data safety tools">
          <Link to="/settings/export">
            <span className="secondary-navigation__icon"><Icon name="template" /></span>
            <span><strong>Export backup</strong><small>Download a private, versioned JSON copy</small></span>
            <Icon className="secondary-navigation__chevron" name="chevron" />
          </Link>
          <Link to="/settings/import">
            <span className="secondary-navigation__icon"><Icon name="template" /></span>
            <span><strong>Import / restore backup</strong><small>Validate and preview before replacing data</small></span>
            <Icon className="secondary-navigation__chevron" name="chevron" />
          </Link>
        </div>
      </section>

      <details className="section-block danger-zone">
        <summary>Reset local data</summary>
        <div className="notice notice--warning">
          <strong>This affects only this browser/device</strong>
          <span>Reset removes current local data and restores the baseline Officially Organised records. Export a backup first if you may need the current data.</span>
          <span>If sync is configured, local reset does not delete cloud data. This device is unlinked from sync metadata during reset.</span>
        </div>
        <p>Type <code>{RESET_PHRASE}</code> exactly to enable reset.</p>
        <label className="form-field">
          <span>Confirmation phrase</span>
          <input autoComplete="off" onChange={(event) => setPhrase(event.target.value)} value={phrase} />
        </label>
        <button className="button button--danger" disabled={resetting || phrase !== RESET_PHRASE} onClick={reset} type="button">
          {resetting ? "Resetting..." : "Reset and reseed local data"}
        </button>
        {resetDone ? (
          <div className="notice notice--success" role="status">
            <strong>Reset complete</strong>
            <span>Baseline records have been restored without duplicates. Sync metadata was cleared for this device.</span>
          </div>
        ) : null}
      </details>

      <section className="settings-links" aria-label="Family settings">
        <Link to="/hub">
          <span className="secondary-navigation__icon"><Icon name="home" /></span>
          <span><strong>Household Hub</strong><small>Read-only calm display for a family screen</small></span>
          <Icon className="secondary-navigation__chevron" name="chevron" />
        </Link>
        <Link to="/hub/wallboard">
          <span className="secondary-navigation__icon"><Icon name="clock" /></span>
          <span><strong>Hub wallboard</strong><small>Auto-rotating read-only kitchen display</small></span>
          <Icon className="secondary-navigation__chevron" name="chevron" />
        </Link>
        <Link to="/settings/countdowns">
          <span className="secondary-navigation__icon"><Icon name="clock" /></span>
          <span><strong>Family countdowns</strong><small>Selected dates, days and sleeps</small></span>
          <Icon className="secondary-navigation__chevron" name="chevron" />
        </Link>
        <Link to="/celebrations">
          <span className="secondary-navigation__icon"><Icon name="gift" /></span>
          <span><strong>Gifts & Celebrations</strong><small>Cards, presents, RSVPs and take-it prep</small></span>
          <Icon className="secondary-navigation__chevron" name="chevron" />
        </Link>
        <Link to="/settings/school-calendar">
          <span className="secondary-navigation__icon"><Icon name="school" /></span>
          <span><strong>Seb's school calendar</strong><small>Illustrative terms, holidays and closure days</small></span>
          <Icon className="secondary-navigation__chevron" name="chevron" />
        </Link>
      </section>

      <HubWallboardSettingsPanel />

      <SyncSettingsPanel />

      <WeatherSettingsPanel />
    </div>
  );
}
