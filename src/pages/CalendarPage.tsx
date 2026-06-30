import { PageHeader } from "../components/layout/PageHeader";
import { PlaceholderPanel } from "../components/layout/PlaceholderPanel";

export function CalendarPage() {
  return <div className="page-stack"><PageHeader eyebrow="Wider view" title="Calendar">Look a little further ahead when Today and Week are not quite enough.</PageHeader><PlaceholderPanel icon="calendar" title="Longer-range view">Use Calendar to scan upcoming dates while Today, Week, Car and Prep remain the main planning surfaces.</PlaceholderPanel></div>;
}
