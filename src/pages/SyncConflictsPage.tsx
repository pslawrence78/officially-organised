import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";
import { describeSyncConflict, resolveSyncConflictKeepCloud, resolveSyncConflictKeepLocal } from "../sync/syncEngine";
import { getOpenSyncConflicts } from "../sync/syncConflictRepository";

export function SyncConflictsPage() {
  const [version, setVersion] = useState(0);
  const [busyId, setBusyId] = useState<string>();
  const [message, setMessage] = useState("");
  const query = useRepositoryQuery(getOpenSyncConflicts, [version]);

  const resolve = async (id: string, strategy: "local" | "cloud") => {
    setBusyId(id);
    setMessage("");
    try {
      if (strategy === "local") await resolveSyncConflictKeepLocal(id);
      else await resolveSyncConflictKeepCloud(id);
      setMessage(strategy === "local" ? "Conflict resolved by keeping the local version." : "Conflict resolved by keeping the cloud version.");
      setVersion((value) => value + 1);
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Optional household sync" title="Sync conflicts">
        Review records that changed both locally and in the cloud. Nothing is overwritten until you choose.
      </PageHeader>
      {query.data?.length ? query.data.map((conflict) => (
        <section className="section-block" key={conflict.id}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{conflict.entityType}</p>
              <h2>{describeSyncConflict(conflict)}</h2>
            </div>
          </div>
          <p>{conflict.reason}</p>
          <dl>
            <div><dt>Local updated</dt><dd>{conflict.localUpdatedAt ? new Date(conflict.localUpdatedAt).toLocaleString() : "Unknown"}</dd></div>
            <div><dt>Cloud updated</dt><dd>{conflict.remoteUpdatedAt ? new Date(conflict.remoteUpdatedAt).toLocaleString() : "Unknown"}</dd></div>
          </dl>
          <div className="form-actions">
            <button className="button button--primary" disabled={busyId === conflict.id} onClick={() => void resolve(conflict.id, "local")} type="button">Keep local</button>
            <button className="button button--secondary" disabled={busyId === conflict.id} onClick={() => void resolve(conflict.id, "cloud")} type="button">Keep cloud</button>
          </div>
        </section>
      )) : <div className="notice notice--success"><strong>No open sync conflicts</strong><span>Everything is currently aligned or safely queued.</span></div>}
      {message ? <div className="notice" role="status"><span>{message}</span></div> : null}
      <Link className="back-link" to="/settings">Back to settings</Link>
    </div>
  );
}
