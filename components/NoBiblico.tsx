"use client";

import type { PositionedPerson } from "@/data/biblia";

interface NoBiblicoProps {
  position: PositionedPerson;
  isSelected: boolean;
  isHighlighted: boolean;
  onOpen: (id: string) => void;
}

export function NoBiblico({
  position,
  isSelected,
  isHighlighted,
  onOpen,
}: NoBiblicoProps) {
  const { person, x, y } = position;

  return (
    <g
      aria-label={`${person.name}. ${person.relationship}. Referência: ${person.reference}.`}
      className={`person-node ${isSelected ? "is-selected" : ""} ${isHighlighted ? "is-highlighted" : ""}`}
      data-person={person.id}
      onClick={() => onOpen(person.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(person.id);
        }
      }}
      role="button"
      tabIndex={0}
      transform={`translate(${x}, ${y})`}
    >
      <rect
        className="person-card"
        height="54"
        rx="10"
        width="166"
        x="-83"
        y="-27"
      />
      <circle className="person-dot" cx="-65" cy="0" r="4" />
      <text className="person-label" textAnchor="middle" x="7" y="4">
        {person.name.length > 23 ? `${person.name.slice(0, 21)}…` : person.name}
      </text>
      <title>{`${person.name} · ${person.relationship} · ${person.reference}`}</title>
    </g>
  );
}
