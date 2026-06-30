import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { PageHeader } from "../components/layout/PageHeader";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import {
  betaChecklistItems,
  createBetaDiagnosticsText,
  getBetaReadinessReport,
  updateBetaChecklistItem,
  type BetaChecklistState,
  type ReadinessLabel,
} from "../services/betaReadinessService";
import { STORE_LABELS } from "../services/dataBoundaries";
import type { ExportStoreName } from "../types/importExport";

function statusTone(label: ReadinessLabel) {
  if (label === "Ready") return "success";
  if (label === "Not configured") return "neutral";
  return "warning";
}

export function BetaReadinessPage() {
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [savingKey, setSavingKey] = useState<keyof Omit<BetaChecklistState, "updatedAt">>();
  const state = useRepositoryQuery(getBetaReadinessReport, [version]);

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, []);

  const toggleChecklist = async (key: keyof Omit<BetaChecklistState, "updatedAt">, checked: boolean) => {
    setSavingKey(key);
    setMessage("");
    try {
      await updateBetaChecklistItem(key, checked);
      setVersion((value) => value + 1);
    } finally {
      setSavingKey(undefined);
    }
  };

  const copyDiagnostics = async () => {
    if (!state.data) return;
    await navigator.clipboard?.writeText(createBetaDiagnosticsText(state.data));
    setMessage("Beta diagnostics copied without private schedule content or sync secrets.");
  };

  return (
    <div className="page-stack data-safety-page">
      <PageHeader eyebrow="Quiet confidence" title="Beta readiness">
        Safe technical diagnostics, local soak checkpoints, and practical signals for real family beta use on this device.
      </PageHeader>

      <div className="notice">
        <strong>Private and technical only</strong>
        <span>Copied diagnostics exclude schedule titles, notes, places, family activity detail, auth tokens, Supabase keys, and cloud credentials.</span>
      </div>

      {state.loading ? <LoadingState label="Checking beta readiness…" /> : null}
      {state.error ? <ErrorState>Beta readiness could not be checked right now. Local planning is still available.</ErrorState> : null}

      {state.data ? (
        <>
          {(() => {
            const report = state.data;
            return (
              <>
          <section className="settings-card">
            <dl>
              <div><dt>App version</dt><dd>{report.appVersion}</dd></div>
              <div><dt>Dexie schema</dt><dd>{report.dexieSchemaVersion}</dd></div>
              <div><dt>App data schema</dt><dd><code>{report.appDataSchema}</code></dd></div>
              <div><dt>Export schema</dt><dd><code>{report.exportSchema} v{report.exportSchemaVersion}</code></dd></div>
              <div><dt>Online</dt><dd className={`readiness-status readiness-status--${statusTone(report.online)}`}>{report.online}</dd></div>
              <div><dt>PWA standalone</dt><dd className={`readiness-status readiness-status--${statusTone(report.pwaStandalone)}`}>{report.pwaStandalone}</dd></div>
              <div><dt>Service worker</dt><dd className={`readiness-status readiness-status--${statusTone(report.serviceWorker)}`}>{report.serviceWorker}</dd></div>
              <div><dt>Manual sync</dt><dd className={`readiness-status readiness-status--${statusTone(report.sync)}`}>{report.sync}</dd></div>
              <div><dt>Pending sync records</dt><dd>{report.pendingSyncRecords}</dd></div>
              <div><dt>Open sync conflicts</dt><dd>{report.openConflicts}</dd></div>
              <div><dt>Last sync success</dt><dd>{report.lastSyncAt ? new Date(report.lastSyncAt).toLocaleString() : "Not yet recorded"}</dd></div>
              <div><dt>Last sync attempt</dt><dd>{report.lastSyncAttemptAt ? new Date(report.lastSyncAttemptAt).toLocaleString() : "Not yet recorded"}</dd></div>
              <div><dt>Last export</dt><dd>{report.lastExportAt ? new Date(report.lastExportAt).toLocaleString() : "Not yet recorded"}</dd></div>
            </dl>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Quick evidence</p>
                <h2>Safe store counts</h2>
              </div>
            </div>
            <div className="record-count-grid">
              {report.majorStoreCounts.map((item) => (
                <div key={item.store}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
            <details>
              <summary>Show all exported store counts</summary>
              <div className="comparison-grid beta-readiness-grid">
                <strong>Store</strong>
                <strong aria-hidden="true" />
                <strong>Count</strong>
                {(Object.keys(report.storeCounts) as ExportStoreName[]).map((store) => (
                  <div className="comparison-row" key={store}>
                    <span>{STORE_LABELS[store]}</span>
                    <span />
                    <span>{report.storeCounts[store]}</span>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Manual checks</p>
                <h2>Beta soak checkpoints</h2>
              </div>
            </div>
            <p className="supporting-copy">Use these lightweight checks to record whether real-device rehearsal has happened on this installation. The full step-by-step runbooks live in the tranche 10D documentation.</p>
            <div className="beta-checklist">
              {betaChecklistItems.map((item) => (
                <label className="check-row" key={item.key}>
                  <input
                    checked={report.checklist[item.key]}
                    disabled={savingKey === item.key}
                    onChange={(event) => void toggleChecklist(item.key, event.target.checked)}
                    type="checkbox"
                  />
                  <span className="check-row__content">
                    <strong>{item.label}</strong>
                    <small>{item.help}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="form-actions">
            <button className="button button--secondary" onClick={() => void copyDiagnostics()} type="button">Copy beta diagnostics</button>
            <Link className="button button--secondary" to="/settings/export">Export backup</Link>
            <Link className="button button--secondary" to="/settings/import">Restore rehearsal</Link>
            <Link className="button button--secondary" to="/settings/sync">Sync review</Link>
          </div>
              </>
            );
          })()}
        </>
      ) : null}

      {message ? <div className="notice notice--success" role="status"><span>{message}</span></div> : null}
      <Link className="back-link" to="/settings">Back to settings</Link>
    </div>
  );
}
