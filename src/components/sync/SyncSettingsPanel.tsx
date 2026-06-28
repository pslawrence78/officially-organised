import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../common/AsyncState";
import { getSyncSettings, setSyncPrepared } from "../../data/repositories";
import { useRepositoryQuery } from "../../hooks/useRepositoryQuery";
import { getSupabaseAvailability, type EnvSource } from "../../sync/supabaseConfig";
import { getCurrentSession, signInWithMagicLink, signOut } from "../../sync/authService";

interface SyncSettingsPanelProps {
  env?: EnvSource;
}

export function SyncSettingsPanel({ env }: SyncSettingsPanelProps = {}) {
  const [version, setVersion] = useState(0);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const availability = getSupabaseAvailability(env);
  const query = useRepositoryQuery(async () => {
    const syncSettings = await getSyncSettings();
    if (!availability.configured) {
      return {
        syncSettings,
        session: null,
        authMessage: "Unavailable until Supabase is configured",
      };
    }

    const sessionResult = await getCurrentSession();
    return {
      syncSettings,
      session: sessionResult.ok ? sessionResult.value : null,
      authMessage: sessionResult.ok ? "Signed in" : sessionResult.reason === "not_configured" ? "Unavailable until Supabase is configured" : sessionResult.message,
    };
  }, [version, availability.configured]);

  useEffect(() => setMessage(""), [availability.status]);

  const togglePrepared = async (enabled: boolean) => {
    setBusy(true);
    try {
      await setSyncPrepared(enabled);
      setVersion((value) => value + 1);
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
      setVersion((value) => value + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section-block sync-settings">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Optional household sync</p>
          <h2>Supabase foundation</h2>
        </div>
      </div>

      {query.loading ? <LoadingState label="Checking sync settings..." /> : null}
      {query.error ? <ErrorState>Sync settings could not be read. Local planning is still available.</ErrorState> : null}

      <div className="settings-card">
        <dl>
          <div><dt>Supabase</dt><dd>{availability.label}</dd></div>
          <div><dt>Auth</dt><dd>{query.data?.authMessage ?? "Checking..."}</dd></div>
          <div><dt>Device prepared</dt><dd>{query.data?.syncSettings.enabled ? "On" : "Off"}</dd></div>
          <div><dt>Last sync</dt><dd>{query.data?.syncSettings.lastSyncStatus === "never" ? "Not synced" : query.data?.syncSettings.lastSyncStatus ?? "Not yet available"}</dd></div>
        </dl>
      </div>

      <div className="notice">
        <strong>Local-first safety</strong>
        <span>{availability.detail} No family records are pushed or pulled in Tranche 8A.</span>
      </div>
      <div className="notice notice--warning">
        <strong>Privacy</strong>
        <span>Future sync will store selected family logistics data in your Supabase project. Use only the project URL and publishable key in frontend builds.</span>
      </div>

      <label className="check-row">
        <input
          checked={query.data?.syncSettings.enabled ?? false}
          disabled={busy || !query.data}
          onChange={(event) => togglePrepared(event.target.checked)}
          type="checkbox"
        />
        <span><strong>Prepare this device for sync</strong><small>This stores local metadata only. It does not upload or download data.</small></span>
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

      {availability.configured && query.data?.session ? (
        <div className="form-actions">
          <button className="button button--secondary" disabled={busy} onClick={endSession} type="button">Sign out</button>
        </div>
      ) : null}

      <p className="form-help">Manual setup docs: <code>docs/08A-supabase-sync-foundation-v0.1.md</code></p>
      {message ? <div className="notice" role="status"><span>{message}</span></div> : null}
    </section>
  );
}
