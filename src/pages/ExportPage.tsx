import { Link } from "react-router-dom";
import { Icon } from "../components/common/Icon";

export function ExportPage() {
  return <div className="empty-state"><span className="empty-state__icon"><Icon name="template" /></span><p className="eyebrow">Data safety · later tranche</p><h1>Export isn’t active yet</h1><p>Versioned JSON backup and export will be added later. No export functionality is active in Tranche 0.</p><Link className="button-link" to="/settings">Back to settings</Link></div>;
}
