import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../common/AsyncState";
import { useRepositoryQuery } from "../../hooks/useRepositoryQuery";
import {
  defaultHubWallboardSettings,
  HUB_WALLBOARD_SETTINGS_ID,
  sanitizeHubWallboardSettings,
} from "../../services/hubRotationService";
import type { HubReducedMotionAutoRotate, HubWallboardSettings } from "../../types/hubRotation";
import { getSetting, saveSetting } from "../../data/repositories";

function updateSettings(settings: HubWallboardSettings, patch: Partial<HubWallboardSettings>) {
  return sanitizeHubWallboardSettings({ ...settings, ...patch });
}

export function HubWallboardSettingsPanel() {
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const state = useRepositoryQuery(async () => {
    const record = await getSetting(HUB_WALLBOARD_SETTINGS_ID);
    return sanitizeHubWallboardSettings(record?.value ?? defaultHubWallboardSettings);
  }, [revision]);

  const save = async (settings: HubWallboardSettings) => {
    setSaving(true);
    await saveSetting(HUB_WALLBOARD_SETTINGS_ID, settings, "Household Hub wallboard display settings");
    setRevision((value) => value + 1);
    setSaving(false);
  };

  if (state.loading) return <LoadingState label="Loading Hub wallboard settings..." />;
  if (state.error || !state.data) return <ErrorState>Hub wallboard settings could not be loaded.</ErrorState>;

  const settings = state.data;

  return (
    <section className="section-block hub-wallboard-settings">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Household display</p>
          <h2>Hub wallboard</h2>
        </div>
      </div>

      <div className="hub-settings-grid">
        <label className="form-field form-field--checkbox">
          <input
            checked={settings.rotationEnabled}
            onChange={(event) => void save(updateSettings(settings, { rotationEnabled: event.target.checked }))}
            type="checkbox"
          />
          <span>Auto-rotation</span>
        </label>
        <label className="form-field form-field--checkbox">
          <input
            checked={settings.skipEmptyPanels}
            onChange={(event) => void save(updateSettings(settings, { skipEmptyPanels: event.target.checked }))}
            type="checkbox"
          />
          <span>Skip quiet panels</span>
        </label>
        <label className="form-field form-field--checkbox">
          <input
            checked={settings.wakeLockEnabled}
            onChange={(event) => void save(updateSettings(settings, { wakeLockEnabled: event.target.checked }))}
            type="checkbox"
          />
          <span>Allow wake lock control</span>
        </label>
        <label className="form-field">
          <span>Default dwell seconds</span>
          <input
            max={120}
            min={5}
            onChange={(event) => void save(updateSettings(settings, { defaultDwellSeconds: Number(event.target.value) }))}
            step={5}
            type="number"
            value={settings.defaultDwellSeconds}
          />
        </label>
        <label className="form-field">
          <span>Reduced motion</span>
          <select
            onChange={(event) => void save(updateSettings(settings, { reducedMotionAutoRotate: event.target.value as HubReducedMotionAutoRotate }))}
            value={settings.reducedMotionAutoRotate}
          >
            <option value="respect-system">Respect system</option>
            <option value="always-off">Always static</option>
            <option value="allow">Allow rotation</option>
          </select>
        </label>
      </div>

      <div className="form-actions">
        <Link className="button button--secondary" to="/hub/wallboard">Open wallboard</Link>
        <button className="button button--secondary" disabled={saving} onClick={() => void save(defaultHubWallboardSettings)} type="button">
          Reset wallboard defaults
        </button>
      </div>
      {saving ? <p className="supporting-copy" role="status">Saving wallboard settings...</p> : null}
    </section>
  );
}
