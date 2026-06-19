import { PageHeader } from "../components/layout/PageHeader";
import { PlaceholderPanel } from "../components/layout/PlaceholderPanel";

export function RoutinesPage() {
  return <div className="page-stack"><PageHeader eyebrow="The regular rhythm" title="Routines">Manage recurring clubs, lessons, Baby Group blocks and appointments.</PageHeader><PlaceholderPanel icon="repeat" title="Repeat without retyping">Routine and recurrence controls will arrive after the core event model is established.</PlaceholderPanel></div>;
}
