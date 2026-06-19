import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <div className="empty-state"><p className="eyebrow">A loose end</p><h1>Page not found</h1><p>This route isn’t part of the family loop.</p><Link className="button-link" to="/">Back to dashboard</Link></div>;
}
