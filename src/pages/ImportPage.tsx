import { Link } from "react-router-dom";
import { Icon } from "../components/common/Icon";

export function ImportPage() {
  return <div className="empty-state"><span className="empty-state__icon"><Icon name="template" /></span><p className="eyebrow">Data safety · later tranche</p><h1>Import isn’t active yet</h1><p>Versioned JSON import, validation and a careful preview will be added later. No import functionality is active in Tranche 0.</p><Link className="button-link" to="/settings">Back to settings</Link></div>;
}
