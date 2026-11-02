"use client";

import type { BiblePerson } from "@/data/biblia";

interface PainelPersonagemProps {
  person: BiblePerson;
  parent: BiblePerson | null;
  descendants: BiblePerson[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function PainelPersonagem({
  person,
  parent,
  descendants,
  onClose,
  onNavigate,
}: PainelPersonagemProps) {
  return (
    <aside aria-label={`Detalhes: ${person.name}`} className="detail-panel">
      <div className="detail-panel-top">
        <span className="eyebrow">PESSOA NA ÁRVORE</span>
        <button aria-label="Fechar detalhes" className="icon-button" onClick={onClose}>
          ×
        </button>
      </div>
      <h2>{person.name}</h2>
      <p className="detail-description">{person.description}</p>

      <section className="detail-section">
        <h3>Referência bíblica</h3>
        <p className="reference-text">{person.reference}</p>
      </section>

      <section className="detail-section">
        <h3>Conexão com a pessoa anterior</h3>
        <p className="relationship-text">{person.relationship}</p>
        {parent && (
          <button
            className="relation-link"
            onClick={() => onNavigate(parent.id)}
            type="button"
          >
            <span className="relation-dot" />
            <span>{parent.name}</span>
            <span aria-hidden="true">›</span>
          </button>
        )}
      </section>

      {descendants.length > 0 && (
        <section className="detail-section">
          <h3>Pessoas ligadas a {person.name}</h3>
          <div className="relation-list">
            {descendants.map((child) => (
              <button
                className="relation-link"
                key={child.id}
                onClick={() => onNavigate(child.id)}
                type="button"
              >
                <span className="relation-dot" />
                <span>{child.name}</span>
                <small>{child.relationship}</small>
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="detail-panel-footer">
        As relações estão identificadas como parentesco, descendência, adoção ou discipulado.
        Consulte a referência para conferir o contexto bíblico.
      </div>
    </aside>
  );
}
