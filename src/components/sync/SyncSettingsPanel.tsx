import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../common/AsyncState";
import { ensureSyncDevice, getSyncSettings, setSyncPrepared } from "../../data/repositories";
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
    : !query.data?.session
      ? "Sign in to Supabase first"
      : !query.data?.syncSettings.householdId
        ? "Link a cloud household first"
        : typeof navigator !== "undefined" && navigator.onLine === false
          ? "This device is offline"
          : "";

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
          <div><dt>User</dt><dd>{query.data?.session?.user.email ?? "Not signed in"}</dd></div>
          <div><dt>Household ID</dt><dd>{query.data?.syncSettings.householdId ?? "Not linked"}</dd></div>
          <div><dt>Device ID</dt><dd>{query.data?.device.id ?? "Preparing..."}</dd></div>
          <div><dt>Last sync</dt><dd>{query.data?.syncSettings.lastSyncAt ? new Date(query.data.syncSettings.lastSyncAt).toLocaleString() : "Not synced"}</dd></div>
          <div><dt>Status</dt><dd>{query.data?.syncSettings.lastSyncMessage ?? "Not yet available"}</dd></div>
          <div><dt>Queued local changes</dt><dd>{query.data?.syncSettings.queueCount ?? 0}</dd></div>
          <div><dt>Open conflicts</dt><dd>{query.data?.syncSettings.conflictCount ?? 0}</dd></div>
        </dl>
      </div>

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
        {availability.configured && query.data?.session ? <button className="button button--secondary" disabled={busy} onClick={endSession} type="button">Sign out</button> : null}
      </div>

      {syncDisabledReason ? <p className="form-help">{syncDisabledReason}</p> : null}
      <p className="form-help">Manual setup docs: <code>docs/08B-local-first-supabase-sync-engine-v0.1.md</code></p>
      {message ? <div className="notice" role="status"><span>{message}</span></div> : null}
    </section>
  );
}
