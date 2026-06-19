import { Link } from "react-router-dom";
import type { FamilyMember } from "../../domain/types";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";

const memberEmoji = {
  adult: "●",
  child: "◆",
  pet: "♥",
};

export function PersonCard({ member }: { member: FamilyMember }) {
  return (
    <Link className="person-card" to={`/people/${member.id}`}>
      <span className={`person-avatar person-avatar--${member.memberType}`} aria-hidden="true">
        {memberEmoji[member.memberType]}
      </span>
      <span className="person-card__content">
        <strong>{member.displayName}</strong>
        <span className="person-card__meta">
          <span className="capitalize">{member.memberType}</span>
          <Badge tone={member.active ? "success" : "neutral"}>{member.active ? "Active" : "Inactive"}</Badge>
        </span>
      </span>
      <Icon className="person-card__chevron" name="chevron" />
    </Link>
  );
}
