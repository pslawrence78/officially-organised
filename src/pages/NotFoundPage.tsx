import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <div className="empty-state"><p className="eyebrow">A loose end</p><h1>Page not found</h1><p>This route could not be found inside Officially Organised.</p><Link className="button-link" to="/">Back to dashboard</Link></div>;
}
