import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CATEGORY_LABELS,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  PLACE_TYPES,
  PLACE_TYPE_LABELS,
  STATUS_LABELS,
} from "../../domain/constants";
import { validateEventInput, type ValidationErrors } from "../../domain/validation/eventValidation";
import type { FamilyEvent, FamilyEventInput, FamilyMember, Place } from "../../domain/types";
import { createEvent, createPlace, updateEvent } from "../../data/repositories";
import {
  allDayEndIso,
  currentDateKey,
  dateKeyToIsoStart,
  defaultEventTimes,
  inclusiveAllDayEndDateKey,
  isoToDateKey,
  isoToDateTimeLocal,
  localDateTimeToIso,
} from "../../utils/dates";
import { MemberSelector } from "./MemberSelector";

interface EventFormProps {
  event?: FamilyEvent;
  familyMembers: FamilyMember[];
  places: Place[];
}

export function EventForm({ event, familyMembers, places }: EventFormProps) {
  const navigate = useNavigate();
  const defaults = defaultEventTimes();
  const [title, setTitle] = useState(event?.title ?? "");
  const [category, setCategory] = useState<FamilyEventInput["category"]>(event?.category ?? "family_social");
  const [status, setStatus] = useState<FamilyEventInput["status"]>(event?.status ?? "confirmed");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startLocal, setStartLocal] = useState(event ? isoToDateTimeLocal(event.startAt) : defaults.start);
  const [endLocal, setEndLocal] = useState(event ? isoToDateTimeLocal(event.endAt) : defaults.end);
  const [startDate, setStartDate] = useState(event ? isoToDateKey(event.startAt) : currentDateKey());
  const [endDate, setEndDate] = useState(event ? inclusiveAllDayEndDateKey(event.endAt) : currentDateKey());
  const [placeId, setPlaceId] = useState(event?.placeId ?? "");
  const [availablePlaces, setAvailablePlaces] = useState(places);
  const [addingPlace, setAddingPlace] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceType, setNewPlaceType] = useState<(typeof PLACE_TYPES)[number]>("other");
  const [placeSaveError, setPlaceSaveError] = useState("");
  const [participants, setParticipants] = useState(event?.participants ?? []);
  const [responsibleAdults, setResponsibleAdults] = useState(event?.responsibleAdults ?? []);
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const adults = familyMembers.filter((member) => member.memberType === "adult");

  const onSubmit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    setSaveError("");

    let startAt = "";
    let endAt = "";
    try {
      startAt = allDay ? dateKeyToIsoStart(startDate) : localDateTimeToIso(startLocal);
      endAt = allDay ? allDayEndIso(endDate) : localDateTimeToIso(endLocal);
    } catch {
      setErrors({ startAt: "Choose a valid start.", endAt: "Choose a valid end." });
      return;
    }

    const input: FamilyEventInput = {
      title,
      category,
      status,
      startAt,
      endAt,
      allDay,
      placeId: placeId || undefined,
      participants,
      responsibleAdults,
      notes: notes || undefined,
    };
    const validationErrors = validateEventInput(input, familyMembers, availablePlaces);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      const saved = event ? await updateEvent(event.id, input) : await createEvent(input);
      navigate(`/events/${saved.id}`, { replace: true, state: { saved: true } });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The event could not be saved.");
      setSaving(false);
    }
  };

  const addPlaceInline = async () => {
    setPlaceSaveError("");
    if (!newPlaceName.trim()) {
      setPlaceSaveError("Give the place a name.");
      return;
    }
    try {
      const place = await createPlace({ name: newPlaceName, placeType: newPlaceType });
      setAvailablePlaces((current) => [...current, place].sort((a, b) => a.name.localeCompare(b.name)));
      setPlaceId(place.id);
      setAddingPlace(false);
      setNewPlaceName("");
      setNewPlaceType("other");
    } catch (error) {
      setPlaceSaveError(error instanceof Error ? error.message : "The place could not be added.");
    }
  };

  return (
    <form className="data-form" noValidate onSubmit={onSubmit}>
      {saveError ? <div className="notice notice--error" role="alert">{saveError}</div> : null}
      <label className={`form-field${errors.title ? " has-error" : ""}`}>
        <span>Event title</span>
        <input autoFocus maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Seb swimming" value={title} />
        {errors.title ? <span className="field-error">{errors.title}</span> : null}
      </label>

      <div className="form-grid">
        <label className={`form-field${errors.category ? " has-error" : ""}`}>
          <span>Category</span>
          <select onChange={(e) => setCategory(e.target.value as FamilyEventInput["category"])} value={category}>
            {EVENT_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}
          </select>
        </label>
        <label className={`form-field${errors.status ? " has-error" : ""}`}>
          <span>Status</span>
          <select onChange={(e) => setStatus(e.target.value as FamilyEventInput["status"])} value={status}>
            {EVENT_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
          </select>
        </label>
      </div>

      <label className="toggle-field">
        <input checked={allDay} onChange={(e) => setAllDay(e.target.checked)} type="checkbox" />
        <span><strong>All-day event</strong><small>Use dates rather than exact times</small></span>
      </label>

      {allDay ? (
        <div className="form-grid">
          <label className={`form-field${errors.startAt ? " has-error" : ""}`}><span>Start date</span><input onChange={(e) => setStartDate(e.target.value)} type="date" value={startDate} />{errors.startAt ? <span className="field-error">{errors.startAt}</span> : null}</label>
          <label className={`form-field${errors.endAt ? " has-error" : ""}`}><span>End date</span><input min={startDate} onChange={(e) => setEndDate(e.target.value)} type="date" value={endDate} />{errors.endAt ? <span className="field-error">{errors.endAt}</span> : null}</label>
        </div>
      ) : (
        <div className="form-grid">
          <label className={`form-field${errors.startAt ? " has-error" : ""}`}><span>Starts</span><input onChange={(e) => setStartLocal(e.target.value)} type="datetime-local" value={startLocal} />{errors.startAt ? <span className="field-error">{errors.startAt}</span> : null}</label>
          <label className={`form-field${errors.endAt ? " has-error" : ""}`}><span>Ends</span><input onChange={(e) => setEndLocal(e.target.value)} type="datetime-local" value={endLocal} />{errors.endAt ? <span className="field-error">{errors.endAt}</span> : null}</label>
        </div>
      )}

      <MemberSelector error={errors.participants} label="Who is involved?" members={familyMembers} onChange={setParticipants} selectedIds={participants} />
      <MemberSelector error={errors.responsibleAdults} label="Responsible adult (optional)" members={adults} onChange={setResponsibleAdults} selectedIds={responsibleAdults} />

      <label className={`form-field${errors.placeId ? " has-error" : ""}`}>
        <span>Place (optional)</span>
        <select onChange={(e) => setPlaceId(e.target.value)} value={placeId}>
          <option value="">No place selected</option>
          {availablePlaces.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
        </select>
        <button className="inline-link-button" onClick={() => setAddingPlace((value) => !value)} type="button">{addingPlace ? "Cancel new place" : "+ Add a new place here"}</button>
        {errors.placeId ? <span className="field-error">{errors.placeId}</span> : null}
      </label>

      {addingPlace ? <section className="inline-create" aria-label="Add a new place"><div className="form-grid"><label className="form-field"><span>New place name</span><input onChange={(e) => setNewPlaceName(e.target.value)} placeholder="e.g. Beavers HQ" value={newPlaceName} /></label><label className="form-field"><span>Type</span><select onChange={(e) => setNewPlaceType(e.target.value as (typeof PLACE_TYPES)[number])} value={newPlaceType}>{PLACE_TYPES.map((value) => <option key={value} value={value}>{PLACE_TYPE_LABELS[value]}</option>)}</select></label></div>{placeSaveError ? <span className="field-error">{placeSaveError}</span> : null}<button className="button button--secondary" onClick={addPlaceInline} type="button">Add and select place</button></section> : null}

      <label className="form-field">
        <span>Notes (optional)</span>
        <textarea maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="Anything useful to remember about the event" rows={4} value={notes} />
      </label>

      <div className="form-actions">
        <Link className="button button--secondary" to={event ? `/events/${event.id}` : "/today"}>Cancel</Link>
        <button className="button button--primary" disabled={saving} type="submit">{saving ? "Saving…" : event ? "Save changes" : "Create event"}</button>
      </div>
    </form>
  );
}
