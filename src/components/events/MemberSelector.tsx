import type { FamilyMember } from "../../domain/types";

interface MemberSelectorProps {
  error?: string;
  label: string;
  members: FamilyMember[];
  onChange: (ids: string[]) => void;
  selectedIds: string[];
}

export function MemberSelector({ error, label, members, onChange, selectedIds }: MemberSelectorProps) {
  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id]);
  };

  return (
    <fieldset className={`form-field form-field--fieldset${error ? " has-error" : ""}`}>
      <legend>{label}</legend>
      <div className="member-selector">
        {members.map((member) => (
          <label className={selectedIds.includes(member.id) ? "is-selected" : ""} key={member.id}>
            <input
              checked={selectedIds.includes(member.id)}
              onChange={() => toggle(member.id)}
              type="checkbox"
              value={member.id}
            />
            <span className={`member-selector__avatar member-selector__avatar--${member.memberType}`}>
              {member.displayName.slice(0, 1)}
            </span>
            <span>{member.displayName}</span>
          </label>
        ))}
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </fieldset>
  );
}
