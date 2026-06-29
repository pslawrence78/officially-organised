import type { SchoolHubLink } from "../../services/schoolHubService";
import { Link } from "react-router-dom";
import { Icon } from "../common/Icon";

export function SchoolConfigLinks({ links }: { links: SchoolHubLink[] }) {
  return (
    <section className="settings-links" aria-label="Manage school setup">
      {links.map((link) => (
        <Link key={link.id} to={link.to}>
          <span className="secondary-navigation__icon"><Icon name="school" /></span>
          <span><strong>{link.label}</strong><small>{link.description}</small></span>
          <Icon className="secondary-navigation__chevron" name="chevron" />
        </Link>
      ))}
    </section>
  );
}
