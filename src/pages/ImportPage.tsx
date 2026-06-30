import { type ChangeEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { restoreFromImport, validateAndPreviewImport } from "../services/importExportService";
import { STORE_LABELS } from "../services/dataBoundaries";
import { EXPORT_STORE_NAMES, type ImportValidationResult } from "../types/importExport";

const RESTORE_PHRASE = "RESTORE MY DATA";

export function ImportPage() {
  const [json, setJson] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportValidationResult>();
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const validationRef = useRef<HTMLDivElement>(null);

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setJson(await file.text());
    setResult(undefined);
    setSuccess(false);
  };

  const preview = async () => {
    setBusy(true);
    setSuccess(false);
    const next = await validateAndPreviewImport(json);
    setResult(next);
    setBusy(false);
    requestAnimationFrame(() => validationRef.current?.focus());
  };

  const restore = async () => {
    if (!result?.valid || !result.payload || phrase !== RESTORE_PHRASE) return;
    setBusy(true);
    setRestoreError("");
    try {
      await restoreFromImport(result.payload);
      setSuccess(true);
      setPhrase("");
      setResult(undefined);
      setJson("");
      setFileName("");
    } catch {
      setRestoreError("Restore failed. Your existing local data has not been replaced. Please check the backup and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack data-safety-page">
      <PageHeader eyebrow="Local data safety" title="Import and restore">
        Validate a backup before replacing the data held in this browser.
      </PageHeader>
      <div className="notice notice--warning">
        <strong>Restore replaces current local data</strong>
        <span>There is no merge mode. Your current data is preserved unless you validate a backup and explicitly confirm the restore.</span>
        <span>Supabase sync and JSON restore are separate concepts. A restore changes this device only until you deliberately run Sync now later.</span>
        <span>Rehearse this flow in a controlled test before relying on backup as the beta safety net. The file stays on this device and is not uploaded.</span>
        <span>After restore, sync is marked as needing review. Restored records are not auto-pushed to Supabase; use Sync now explicitly when ready.</span>
      </div>
      <section className="section-block import-inputs">
        <div>
          <label className="form-field">
            <span>Choose a JSON backup file</span>
            <input accept="application/json,.json" onChange={selectFile} type="file" />
          </label>
          {fileName ? <small>Selected: {fileName}</small> : null}
        </div>
        <div className="import-divider" aria-hidden="true"><span>or</span></div>
        <label className="form-field">
          <span>Paste backup JSON</span>
          <textarea onChange={(event) => { setJson(event.target.value); setResult(undefined); }} placeholder="Paste the complete backup JSON here" rows={8} value={json} />
        </label>
        <button className="button button--primary" disabled={busy || !json.trim()} onClick={preview} type="button">{busy ? "Checking..." : "Validate and preview"}</button>
      </section>
      {result ? (
        <div ref={validationRef} tabIndex={-1}>
          {result.valid && result.preview ? (
            <section className="section-block import-preview">
              {(() => {
                const preview = result.preview!;
                return (
                  <>
              <div className="notice notice--success">
                <strong>Backup is valid</strong>
                <span>Review the replacement counts before restoring.</span>
              </div>
              <dl>
                <div><dt>Source</dt><dd>{preview.sourceAppName}</dd></div>
                <div><dt>Exported</dt><dd>{new Date(preview.exportedAt).toLocaleString()}</dd></div>
                <div><dt>Schema</dt><dd><code>{preview.schema}</code></dd></div>
                <div><dt>Mode</dt><dd>Replace current local data</dd></div>
              </dl>
              <div className="comparison-grid">
                <strong>Category</strong>
                <strong>Current</strong>
                <strong>Backup</strong>
                {EXPORT_STORE_NAMES.map((store) => (
                  <div className="comparison-row" key={store}>
                    <span>{STORE_LABELS[store]}</span>
                    <span>{preview.currentRecordCounts[store]}</span>
                    <span>{preview.importedRecordCounts[store]}</span>
                  </div>
                ))}
              </div>
              {result.warnings.map((item) => <p className="validation-warning" key={`${item.code}-${item.path}`}>{item.message}</p>)}
              <div className="restore-confirmation">
                <p><strong>Final confirmation</strong></p>
                <p>Type <code>{RESTORE_PHRASE}</code> exactly to enable restore.</p>
                <label className="form-field">
                  <span>Confirmation phrase</span>
                  <input autoComplete="off" onChange={(event) => setPhrase(event.target.value)} value={phrase} />
                </label>
                <button className="button button--danger" disabled={busy || phrase !== RESTORE_PHRASE} onClick={restore} type="button">Restore and replace local data</button>
              </div>
                  </>
                );
              })()}
            </section>
          ) : (
            <section className="notice notice--error" aria-live="polite">
              <strong>Backup cannot be restored</strong>
              <ul>
                {result.errors.map((item, index) => (
                  <li key={`${item.code}-${item.path}-${index}`}>
                    {item.message}
                    {item.path ? <small> ({item.path})</small> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : null}
      {success ? <div className="notice notice--success" role="status"><strong>Restore complete</strong><span>The backup is now active. Sync has not pushed this restored data to Supabase.</span><button className="button button--secondary" onClick={() => window.location.reload()} type="button">Reload app</button></div> : null}
      {restoreError ? <div className="notice notice--error" role="alert"><strong>Restore not completed</strong><span>{restoreError}</span></div> : null}
      <Link className="back-link" to="/settings">Back to settings</Link>
    </div>
  );
}
