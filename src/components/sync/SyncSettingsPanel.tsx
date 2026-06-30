import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { APP_VERSION } from "../../config/appVersion";
import { ErrorState, LoadingState } from "../common/AsyncState";
import { confirmFirstSync, disconnectSyncDevice, ensureSyncDevice, getSyncSettings, pauseSync, resumeSync, setSyncPrepared } from "../../data/repositories";
import { databaseMetadata } from "../../data/db";
import { EXPORT_DATA_SCHEMA } from "../../domain/constants";
import { useRepositoryQuery } from "../../hooks/useRepositoryQuery";
import { getSupabaseAvailability, type EnvSource } from "../../sync/supabaseConfig";
import { getAuthDiagnostics, getCurrentSession, signInWithMagicLink, signInWithPassword, signOut } from "../../sync/authService";
import { createCloudHouseholdFromThisDevice, linkFirstRemoteHousehold, runManualSync } from "../../sync/syncEngine";

interface SyncSettingsPanelProps {
  env?: EnvSource;
}

export function SyncSettingsPanel({ env }: SyncSettingsPanelProps = {}) {
  const [version, setVersion] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [firstSyncAccepted, setFirstSyncAccepted] = useState(false);
  const [disconnectPhrase, setDisconnectPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const availability = getSupabaseAvailability(env);
  const diagnostics = getAuthDiagnostics(env);
  const query = useRepositoryQuery(async () => {
    const [syncSettings, device] = await Promise.all([getSyncSettings(), ensureSyncDevice()]);
    if (!availability.configured) {
      return { syncSettings, device, session: null, authMessage: "Unavailable until Supabase is configured" };
    }
    const sessionResult = await getCurrentSession();
    return {
      syncSettings,
      device,
      session: sessionResult.ok ? sessionResult.value : null,
      authMessage: sessionResult.ok ? "Signed in" : sessionResult.reason === "not_configured" ? "Unavailable until Supabase is configured" : sessionResult.message,
    };
  }, [version, availability.configured]);

  useEffect(() => setMessage(""), [availability.status]);

  const refresh = () => setVersion((value) => value + 1);

  const togglePrepared = async (enabled: boolean) => {
    setBusy(true);
    try {
      await setSyncPrepared(enabled);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const pause = async () => {
    setBusy(true);
    try {
      await pauseSync();
      setMessage("Sync paused. Local planning still works and the cloud link is kept.");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const resume = async () => {
    setBusy(true);
    try {
      await resumeSync();
      setMessage("Sync resumed. Use Sync now when you are ready.");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const confirmGuidance = async () => {
    if (!firstSyncAccepted) return;
    setBusy(true);
    try {
      await confirmFirstSync();
      setMessage("First sync guidance confirmed.");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (disconnectPhrase !== "DISCONNECT THIS DEVICE") return;
    setBusy(true);
    try {
      await disconnectSyncDevice();
      setDisconnectPhrase("");
      setMessage("This device was disconnected. Local family data and cloud data were not deleted.");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const requestMagicLink = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await signInWithMagicLink(email);
      setMessage(result.ok ? "Magic link requested. Check your email on this device." : result.message);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const requestPasswordSignIn = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await signInWithPassword(email, password);
      setMessage(result.ok ? "Signed in with email and password for Supabase Auth testing on this device." : result.message);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const endSession = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await signOut();
      setMessage(result.ok ? "Signed out of Supabase on this device." : result.message);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const createHousehold = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await createCloudHouseholdFromThisDevice();
      setMessage(result.ok ? "Cloud household created and linked." : result.message);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const linkHousehold = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await linkFirstRemoteHousehold();
      setMessage(result.ok ? "Remote household linked to this device." : result.message);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const syncNow = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await runManualSync();
      setMessage(result.message);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const syncDisabledReason = !availability.configured
      ? "Supabase is not configured"
    : query.data?.syncSettings.paused || !query.data?.syncSettings.enabled
      ? "Sync is paused on this device"
      : !query.data?.session
      ? "Sign in to Supabase first"
      : !query.data?.syncSettings.householdId
        ? "Link a cloud household first"
        : !query.data?.syncSettings.firstSyncConfirmed
          ? "Confirm first sync guidance before pushing local data"
        : typeof navigator !== "undefined" && navigator.onLine === false
          ? "This device is offline"
          : "";
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  const syncSettings = query.data?.syncSettings;
  const maskedEmail = maskEmail(query.data?.session?.user.email);
  const checklist = [
    ["Supabase environment configured", availability.configured],
    ["User signed in", Boolean(query.data?.session)],
    ["Cloud household linked", Boolean(syncSettings?.householdId)],
    ["Local data reviewed", Boolean(syncSettings?.enabled)],
    ["Initial backup recommended", Boolean(syncSettings?.firstSyncConfirmed)],
    ["Sync ready", !syncDisabledReason],
  ] as const;

  const copyDiagnostics = async () => {
    if (!query.data) return;
    const text = [
      "Officially Organised sync diagnostics",
      `App version: ${APP_VERSION}`,
      `Export schema: ${EXPORT_DATA_SCHEMA}`,
      `Dexie schema version: ${databaseMetadata.schemaVersion}`,
      `User: ${maskedEmail ?? "not signed in"}`,
      `Sync enabled: ${syncSettings?.enabled && !syncSettings.paused ? "yes" : "no"}`,
      `Supabase configured: ${availability.configured ? "yes" : "no"}`,
      `Last sync: ${syncSettings?.lastSyncAt ?? "never"}`,
      `Last attempt: ${syncSettings?.lastSyncAttemptAt ?? "never"}`,
      `Last duration ms: ${syncSettings?.lastSyncDurationMs ?? "not tracked"}`,
      `Last error code: ${syncSettings?.lastSyncErrorCode ?? "none"}`,
      `Last error message: ${syncSettings?.lastSyncErrorMessage ?? "none"}`,
      `Last pull count: ${syncSettings?.lastPullCount ?? 0}`,
      `Last push count: ${syncSettings?.lastPushCount ?? 0}`,
      `Conflict count: ${syncSettings?.conflictCount ?? 0}`,
      `Queue count: ${syncSettings?.queueCount ?? 0}`,
    ].join("\n");
    await navigator.clipboard?.writeText(text);
    setMessage("Diagnostics copied without Supabase keys or secrets.");
  };

  return (
    <section className="section-block sync-settings">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Optional household sync</p>
          <h2>Manual cloud sync</h2>
        </div>
      </div>

      {query.loading ? <LoadingState label="Checking sync settings..." /> : null}
      {query.error ? <ErrorState>Sync settings could not be read. Local planning is still available.</ErrorState> : null}

      <div className="settings-card">
        <dl>
          <div><dt>Supabase</dt><dd>{availability.label}</dd></div>
          <div><dt>Auth</dt><dd>{query.data?.authMessage ?? "Checking..."}</dd></div>
          <div><dt>User</dt><dd>{maskedEmail ?? "Not signed in"}</dd></div>
          <div><dt>Household ID</dt><dd>{query.data?.syncSettings.householdId ?? "Not linked"}</dd></div>
          <div><dt>Device ID</dt><dd>{query.data?.device.id ?? "Preparing..."}</dd></div>
          <div><dt>Last sync</dt><dd>{query.data?.syncSettings.lastSyncAt ? new Date(query.data.syncSettings.lastSyncAt).toLocaleString() : "Not synced"}</dd></div>
          <div><dt>Last attempt</dt><dd>{query.data?.syncSettings.lastSyncAttemptAt ? new Date(query.data.syncSettings.lastSyncAttemptAt).toLocaleString() : "Not attempted"}</dd></div>
          <div><dt>Status</dt><dd>{query.data?.syncSettings.lastSyncMessage ?? "Not yet available"}</dd></div>
          <div><dt>Sync enabled</dt><dd>{query.data?.syncSettings.enabled && !query.data.syncSettings.paused ? "Enabled" : "Paused"}</dd></div>
          <div><dt>Queued local changes</dt><dd>{query.data?.syncSettings.queueCount ?? 0}</dd></div>
          <div><dt>Open conflicts</dt><dd>{query.data?.syncSettings.conflictCount ?? 0}</dd></div>
        </dl>
      </div>

      {offline ? <div className="notice notice--warning"><strong>Offline - local app still available</strong><span>Dashboard, today, week and prep views keep using local data. Sync now waits until the network returns.</span></div> : null}

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Setup checklist</p><h2>Sync readiness</h2></div></div>
        <ul className="checklist">
          {checklist.map(([label, done]) => <li key={label}><span>{done ? "Done" : "Open"}</span>{label}</li>)}
        </ul>
      </section>

      <div className="notice">
        <strong>Local-first safety</strong>
        <span>{availability.detail} IndexedDB remains the live operational source of truth for every view in the app.</span>
      </div>
      <div className="notice">
        <strong>Auth redirect diagnostics</strong>
        <span>Resolved auth redirect URL: <code>{diagnostics.resolvedRedirectUrl || "Unavailable outside the browser"}</code></span>
      </div>
      <div className="notice">
        <strong>Supabase Auth testing</strong>
        <span>Password sign-in is temporary for Supabase Auth testing only. It does not change the app’s local-first behaviour.</span>
      </div>

      {query.data?.syncSettings.restoredSinceLastSync ? (
        <div className="notice notice--warning">
          <strong>Restore pending sync</strong>
          <span>Restored local data has not yet been synced.</span>
        </div>
      ) : null}

      {availability.configured && query.data?.session && query.data.syncSettings.householdId && !query.data.syncSettings.firstSyncConfirmed ? (
        <div className="notice notice--warning">
          <strong>Before the first cloud sync</strong>
          <span>Family logistics data will be stored in Supabase for the Phil/Beck household. Export a JSON backup first so this browser has a known recovery point.</span>
          <span>Weather forecast cache and device-only data are not synced. Local app use continues if sync later fails.</span>
          <label className="check-row">
            <input checked={firstSyncAccepted} onChange={(event) => setFirstSyncAccepted(event.target.checked)} type="checkbox" />
            <span className="check-row__content"><strong>I have reviewed this and am ready for the first push</strong><small>Sync now stays disabled until this is confirmed.</small></span>
          </label>
          <button className="button button--secondary" disabled={busy || !firstSyncAccepted} onClick={confirmGuidance} type="button">Confirm first sync guidance</button>
        </div>
      ) : null}

      <label className="check-row">
        <input
          checked={query.data?.syncSettings.enabled ?? false}
          disabled={busy || !query.data}
          onChange={(event) => togglePrepared(event.target.checked)}
          type="checkbox"
        />
        <span className="check-row__content">
          <strong>Prepare this device for sync</strong>
          <small>This stores local sync metadata and conflict state on this device.</small>
        </span>
      </label>

      {availability.configured && !query.data?.session ? (
        <div className="form-grid">
          <label className="form-field">
            <span>Email for magic link</span>
            <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>
          <div className="form-actions">
            <button className="button button--secondary" disabled={busy || !email} onClick={requestMagicLink} type="button">Request sign-in link</button>
          </div>
        </div>
      ) : null}

      {availability.configured && !query.data?.session ? (
        <div className="form-grid">
          <label className="form-field">
            <span>Email for temporary password sign-in</span>
            <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>
          <label className="form-field">
            <span>Password for Supabase Auth testing</span>
            <input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          </label>
          <div className="form-actions">
            <button className="button button--secondary" disabled={busy || !email || !password} onClick={requestPasswordSignIn} type="button">Sign in with password</button>
          </div>
        </div>
      ) : null}

      {availability.configured && query.data?.session && !query.data.syncSettings.householdId ? (
        <div className="form-actions">
          <button className="button button--primary" disabled={busy} onClick={createHousehold} type="button">Create cloud household from this device</button>
          <button className="button button--secondary" disabled={busy} onClick={linkHousehold} type="button">Link to existing household</button>
        </div>
      ) : null}

      <div className="form-actions">
        <button className="button button--primary" disabled={busy || Boolean(syncDisabledReason)} onClick={syncNow} type="button">
          {busy ? "Syncing..." : "Sync now"}
        </button>
        {query.data?.syncSettings.conflictCount ? <Link className="button button--secondary" to="/settings/sync">Review conflicts</Link> : null}
        {query.data?.syncSettings.enabled && !query.data.syncSettings.paused ? <button className="button button--secondary" disabled={busy} onClick={pause} type="button">Pause sync</button> : <button className="button button--secondary" disabled={busy || !availability.configured} onClick={resume} type="button">Resume sync</button>}
        {availability.configured && query.data?.session ? <button className="button button--secondary" disabled={busy} onClick={endSession} type="button">Sign out</button> : null}
      </div>

      {syncDisabledReason ? <p className="form-help">{syncDisabledReason}</p> : null}
      <details className="section-block">
        <summary>Sync diagnostics</summary>
        <dl>
          <div><dt>App version</dt><dd>{APP_VERSION}</dd></div>
          <div><dt>Export schema</dt><dd><code>{EXPORT_DATA_SCHEMA}</code></dd></div>
          <div><dt>Dexie schema</dt><dd>{databaseMetadata.schemaVersion}</dd></div>
          <div><dt>Last pull / push</dt><dd>{syncSettings?.lastPullCount ?? 0} / {syncSettings?.lastPushCount ?? 0}</dd></div>
          <div><dt>Last error</dt><dd>{syncSettings?.lastSyncErrorCode ?? "None"}</dd></div>
        </dl>
        <button className="button button--secondary" disabled={!query.data} onClick={() => void copyDiagnostics()} type="button">Copy diagnostics</button>
      </details>

      <details className="section-block danger-zone">
        <summary>Disconnect this device</summary>
        <div className="notice notice--warning"><strong>Local and cloud data are kept</strong><span>This removes Supabase link and sync metadata from this browser only. It does not delete local family data or cloud data.</span></div>
        <label className="form-field"><span>Type DISCONNECT THIS DEVICE</span><input autoComplete="off" onChange={(event) => setDisconnectPhrase(event.target.value)} value={disconnectPhrase} /></label>
        <button className="button button--danger" disabled={busy || disconnectPhrase !== "DISCONNECT THIS DEVICE"} onClick={disconnect} type="button">Disconnect this device</button>
      </details>

      <p className="form-help">Manual setup docs: <code>docs/08-supabase-configuration-guide-v0.1.md</code></p>
      {message ? <div className="notice" role="status"><span>{message}</span></div> : null}
    </section>
  );
}

function maskEmail(value?: string) {
  if (!value) return undefined;
  const [name, domain] = value.split("@");
  if (!domain) return "Signed in";
  return `${name.slice(0, 2)}***@${domain}`;
}
