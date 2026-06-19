import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Icon } from "../components/common/Icon";
import { PageHeader } from "../components/layout/PageHeader";
import { PLACE_TYPES, PLACE_TYPE_LABELS } from "../domain/constants";
import type { Place, PlaceInput } from "../domain/types";
import { createPlace, deletePlace, getPlaceById, updatePlace, validatePlaceInput } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";

export function PlaceFormPage() {
  const { placeId } = useParams();
  const state = useRepositoryQuery(() => placeId ? getPlaceById(placeId) : Promise.resolve(undefined), [placeId]);

  if (state.loading) return <LoadingState label={placeId ? "Opening the place…" : "Preparing a new place…"} />;
  if (state.error) return <ErrorState />;
  if (placeId && !state.data) return <div className="empty-state"><h1>Place not found</h1><p>It may have been removed.</p><Link className="button-link" to="/places">Back to places</Link></div>;

  return <PlaceForm key={state.data?.id ?? "new"} place={state.data} />;
}

function PlaceForm({ place }: { place?: Place }) {
  const navigate = useNavigate();
  const [name, setName] = useState(place?.name ?? "");
  const [placeType, setPlaceType] = useState<PlaceInput["placeType"]>(place?.placeType ?? "other");
  const [address, setAddress] = useState(place?.address ?? "");
  const [postcode, setPostcode] = useState(place?.postcode ?? "");
  const [travelMinutes, setTravelMinutes] = useState(place?.defaultTravelMinutes?.toString() ?? "");
  const [travelNotes, setTravelNotes] = useState(place?.travelNotes ?? "");
  const [parkingNotes, setParkingNotes] = useState(place?.parkingNotes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const input: PlaceInput = {
      name,
      placeType,
      address: address || undefined,
      postcode: postcode || undefined,
      defaultTravelMinutes: travelMinutes === "" ? undefined : Number(travelMinutes),
      travelNotes: travelNotes || undefined,
      parkingNotes: parkingNotes || undefined,
    };
    const validationErrors = validatePlaceInput(input);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    setSaving(true);
    try {
      if (place) await updatePlace(place.id, input);
      else await createPlace(input);
      navigate("/places", { replace: true });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "The place could not be saved." });
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!place || !window.confirm(`Delete “${place.name}”? Events will keep working, but show the place as unavailable.`)) return;
    setSaving(true);
    await deletePlace(place.id);
    navigate("/places", { replace: true });
  };

  return (
    <div className="page-stack page-stack--form">
      <PageHeader eyebrow={place ? "Update a familiar location" : "A reusable location"} title={place ? "Edit place" : "Add place"}>Keep it practical: enough detail for family planning, nothing more.</PageHeader>
      <form className="data-form" noValidate onSubmit={submit}>
        {errors.form ? <div className="notice notice--error" role="alert">{errors.form}</div> : null}
        <label className={`form-field${errors.name ? " has-error" : ""}`}><span>Place name</span><input autoFocus maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lichfield Leisure Centre" value={name} />{errors.name ? <span className="field-error">{errors.name}</span> : null}</label>
        <label className="form-field"><span>Type</span><select onChange={(e) => setPlaceType(e.target.value as PlaceInput["placeType"])} value={placeType}>{PLACE_TYPES.map((value) => <option key={value} value={value}>{PLACE_TYPE_LABELS[value]}</option>)}</select></label>
        <label className="form-field"><span>Address (optional)</span><textarea onChange={(e) => setAddress(e.target.value)} rows={3} value={address} /></label>
        <div className="form-grid"><label className="form-field"><span>Postcode (optional)</span><input autoCapitalize="characters" onChange={(e) => setPostcode(e.target.value)} value={postcode} /></label><label className={`form-field${errors.defaultTravelMinutes ? " has-error" : ""}`}><span>Usual travel minutes</span><input min="0" onChange={(e) => setTravelMinutes(e.target.value)} type="number" value={travelMinutes} />{errors.defaultTravelMinutes ? <span className="field-error">{errors.defaultTravelMinutes}</span> : null}</label></div>
        <label className="form-field"><span>Travel notes (optional)</span><textarea onChange={(e) => setTravelNotes(e.target.value)} rows={3} value={travelNotes} /></label>
        <label className="form-field"><span>Parking notes (optional)</span><textarea onChange={(e) => setParkingNotes(e.target.value)} rows={3} value={parkingNotes} /></label>
        <div className="form-actions form-actions--spread">{place ? <button className="button button--danger" disabled={saving} onClick={remove} type="button"><Icon name="trash" /> Delete</button> : <span />}<div><Link className="button button--secondary" to="/places">Cancel</Link><button className="button button--primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save place"}</button></div></div>
      </form>
    </div>
  );
}
