import { PageHeader } from "../components/layout/PageHeader";
import { PlaceholderPanel } from "../components/layout/PlaceholderPanel";

export function CalendarPage() {
  return <div className="page-stack"><PageHeader eyebrow="Wider view" title="Calendar">Browse further dates when needed, without turning the app into just another calendar.</PageHeader><PlaceholderPanel icon="calendar" title="Dates in context">Calendar browsing will support planning further ahead while Today, Week, Car and Prep remain the heart of the product.</PlaceholderPanel></div>;
}
