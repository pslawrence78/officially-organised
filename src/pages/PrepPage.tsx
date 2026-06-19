import { PageHeader } from "../components/layout/PageHeader";
import { PlaceholderPanel } from "../components/layout/PlaceholderPanel";

export function PrepPage() {
  return <div className="page-stack"><PageHeader eyebrow="Ready in time" title="Prep">A home for the things to pack, buy, charge, complete or remember.</PageHeader><PlaceholderPanel icon="prep" title="Less remembering in your head">Preparation tasks will be grouped here by urgency and owner once event foundations are in place.</PlaceholderPanel></div>;
}
