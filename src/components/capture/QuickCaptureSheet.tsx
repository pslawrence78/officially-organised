import { useMemo, useState } from "react";
import { Icon } from "../common/Icon";
import type { FamilyMember } from "../../domain/types";
import {
  defaultQuickCaptureDraft,
  getQuickCaptureTypeCopy,
  quickCaptureOwners,
  quickCaptureParticipants,
  type QuickCaptureDraft,
  type QuickCaptureKind,
} from "../../services/quickCaptureService";

interface QuickCaptureSheetProps {
  familyMembers: FamilyMember[];
  onClose: () => void;
  onContinue: (draft: QuickCaptureDraft) => void;
  onSave: (draft: QuickCaptureDraft) => Promise<void>;
}

const captureKinds: QuickCaptureKind[] = ["event", "routine", "admin"];

export function QuickCaptureSheet({ familyMembers, onClose, onContinue, onSave }: QuickCaptureSheetProps) {
  const [draft, setDraft] = useState<QuickCaptureDraft>(defaultQuickCaptureDraft);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const participants = useMemo(() => quickCaptureParticipants(familyMembers), [familyMembers]);
  const owners = useMemo(() => quickCaptureOwners(familyMembers), [familyMembers]);

  const saveAllowed = draft.kind !== "routine";

  const submitSave = async () => {
    if (!draft.title.trim()) {
      setError("Add a short title first.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave(draft);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save this item.");
      setSaving(false);
    }
  };

  const submitContinue = () => {
    if (!draft.title.trim()) {
      setError("Add a short title first.");
      return;
    }
    setError("");
    onContinue(draft);
  };

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        aria-label="Quick capture"
        aria-modal="true"
        className="navigation-sheet navigation-sheet--capture"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="navigation-sheet__header">
          <div>
            <p className="eyebrow">Quick capture</p>
            <h2>Rough now, refine later</h2>
          </div>
          <button aria-label="Close quick capture" className="icon-button" onClick={onClose} type="button">
            <Icon name="close" />
          </button>
        </div>

        <p className="section-empty-copy">Pick the right home, add the bare minimum, then save now or continue to full details.</p>

        <div className="capture-type-grid" role="radiogroup" aria-label="Choose what you are adding">
          {captureKinds.map((kind) => {
            const copy = getQuickCaptureTypeCopy(kind);
            return (
              <button
                aria-checked={draft.kind === kind}
                className={`capture-type-card${draft.kind === kind ? " is-selected" : ""}`}
                key={kind}
                onClick={() => setDraft((current) => ({ ...current, kind }))}
                role="radio"
                type="button"
              >
                <strong>{copy.title}</strong>
                <span>{copy.description}</span>
              </button>
            );
          })}
        </div>

        <div className="data-form capture-form">
          {error ? <div className="notice notice--error" role="alert">{error}</div> : null}
          <label className="form-field">
            <span>Title</span>
            <input
              autoFocus
              maxLength={120}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder={draft.kind === "admin" ? "e.g. Home insurance renewal" : draft.kind === "routine" ? "e.g. Swimming lessons" : "e.g. Dentist appointment"}
              value={draft.title}
            />
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>{draft.kind === "admin" ? "Due date" : draft.kind === "routine" ? "Start date" : "Date"}</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                type="date"
                value={draft.date}
              />
            </label>
            <label className="form-field">
              <span>Main person (optional)</span>
              <select
                onChange={(event) => setDraft((current) => ({ ...current, participantId: event.target.value || undefined }))}
                value={draft.participantId ?? ""}
              >
                <option value="">No one selected</option>
                {participants.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </select>
            </label>
          </div>

          <label className="form-field">
            <span>Responsible adult (optional)</span>
            <select
              onChange={(event) => setDraft((current) => ({ ...current, ownerId: event.target.value || undefined }))}
              value={draft.ownerId ?? ""}
            >
              <option value="">No owner selected</option>
              {owners.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
            </select>
          </label>

          <div className="form-actions form-actions--spread">
            <button className="button button--secondary" onClick={onClose} type="button">Cancel</button>
            <div>
              <button className="button button--secondary" onClick={submitContinue} type="button">Continue</button>
              {saveAllowed ? <button className="button button--primary" disabled={saving} onClick={() => void submitSave()} type="button">{saving ? "Saving..." : "Save now"}</button> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
