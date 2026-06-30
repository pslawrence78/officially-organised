import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { PageHeader } from "../components/layout/PageHeader";
import { createExportPayload, downloadExportFile, recordExportCompleted } from "../services/importExportService";
import { STORE_LABELS } from "../services/dataBoundaries";
import { EXPORT_STORE_NAMES } from "../types/importExport";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";

export function ExportPage() {
  const state = useRepositoryQuery(createExportPayload);
  const payload = state.data;
  const [message, setMessage] = useState("");

  const handleDownload = async () => {
    if (!payload) return;
    downloadExportFile(payload);
    await recordExportCompleted(payload.exportId);
    setMessage("Backup downloaded. Keep it somewhere safe.");
  };

  return (
    <div className="page-stack data-safety-page">
      <PageHeader eyebrow="Local data safety" title="Export backup">
        Download a complete, versioned copy of this browser's Officially Organised data.
      </PageHeader>
      <div className="notice notice--warning" role="note">
        <strong>This file contains private family information</strong>
        <span>It may include routines, child activities, appointments, locations and travel plans. Store it somewhere safe and only share it with people you trust.</span>
        <span>This backup is the safety net before beta use, reset work, or major testing on this device.</span>
        <span>Nothing is uploaded: the backup is created locally in this browser. Supabase sync and JSON backup are separate safety tools.</span>
      </div>
      {state.loading ? <LoadingState /> : null}
      {state.error ? <ErrorState /> : null}
      {payload ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Backup contents</p>
              <h2>Ready to download</h2>
            </div>
          </div>
          <div className="record-count-grid">
            {EXPORT_STORE_NAMES.map((store) => (
              <div key={store}>
                <span>{STORE_LABELS[store]}</span>
                <strong>{payload.recordCounts[store]}</strong>
              </div>
            ))}
          </div>
          <p className="supporting-copy">Schema <code>{payload.schema}</code> · database version {payload.databaseVersion}</p>
          <button className="button button--primary" onClick={() => void handleDownload()} type="button">Download backup</button>
        </section>
      ) : null}
      {message ? <div className="notice notice--success" role="status"><strong>Export complete</strong><span>{message}</span></div> : null}
      <Link className="back-link" to="/settings">Back to settings</Link>
    </div>
  );
}
