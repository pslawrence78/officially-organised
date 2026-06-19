import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/common/AsyncState";
import { Badge } from "../components/common/Badge";
import { Icon } from "../components/common/Icon";
import { PageHeader } from "../components/layout/PageHeader";
import { PLACE_TYPE_LABELS } from "../domain/constants";
import { getPlaces } from "../data/repositories";
import { useRepositoryQuery } from "../hooks/useRepositoryQuery";

export function PlacesPage() {
  const state = useRepositoryQuery(getPlaces);
  return (
    <div className="page-stack">
      <div className="page-title-row"><PageHeader eyebrow="Where things happen" title="Places">Reusable locations keep addresses and practical travel notes out of your head.</PageHeader><Link className="compact-action" to="/places/new"><Icon name="plus" /> Add place</Link></div>
      {state.loading ? <LoadingState label="Finding your places…" /> : null}
      {state.error ? <ErrorState /> : null}
      {state.data?.length === 0 ? <section className="empty-panel"><span className="empty-panel__icon"><Icon name="place" /></span><h2>No places yet</h2><p>Add the first reusable location, then select it from an event.</p><Link className="button button--primary" to="/places/new"><Icon name="plus" /> Add a place</Link></section> : null}
      {state.data && state.data.length > 0 ? <section className="place-grid" aria-label="Places">{state.data.map((place) => <Link className="place-card" key={place.id} to={`/places/${place.id}/edit`}><span className="place-card__icon"><Icon name="place" /></span><span className="place-card__body"><Badge tone="accent">{PLACE_TYPE_LABELS[place.placeType]}</Badge><strong>{place.name}</strong>{place.postcode ? <small>{place.postcode}</small> : null}</span><Icon className="person-card__chevron" name="chevron" /></Link>)}</section> : null}
    </div>
  );
}
