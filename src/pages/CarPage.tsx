import { PageHeader } from "../components/layout/PageHeader";
import { PlaceholderPanel } from "../components/layout/PlaceholderPanel";

export function CarPage() {
  return <div className="page-stack"><PageHeader eyebrow="Shared wheels" title="Car">See who needs the family car, when they need it and where practical clashes may appear.</PageHeader><PlaceholderPanel icon="car" title="One car, one clear picture">Car need windows and allocations will appear here. Clash detection belongs to a later tranche.</PlaceholderPanel></div>;
}
