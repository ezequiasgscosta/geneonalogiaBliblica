"use client";

import { useState } from "react";
import type { BiblePerson } from "@/data/biblia";

interface BarraPesquisaProps {
  query: string;
  results: BiblePerson[];
  onQueryChange: (value: string) => void;
  onSelect: (person: BiblePerson) => void;
}

export function BarraPesquisa({
  query,
  results,
  onQueryChange,
  onSelect,
}: BarraPesquisaProps) {
  const [isOpen, setIsOpen] = useState(false);

  function choose(person: BiblePerson) {
    onSelect(person);
    onQueryChange(person.name);
    setIsOpen(false);
  }

  return (
    <div className="search-wrap">
      <svg aria-hidden="true" className="search-icon" fill="none" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
      <input
        aria-label="Pesquisar uma pessoa"
        autoComplete="off"
        id="person-search-input"
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => {
          onQueryChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
          if (event.key === "Enter" && results[0]) choose(results[0]);
        }}
        placeholder="Buscar uma pessoa..."
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-controls="person-search-results"
        value={query}
      />
      {query && (
        <button
          aria-label="Limpar pesquisa"
          className="search-clear"
          onClick={() => {
            onQueryChange("");
            setIsOpen(false);
          }}
          type="button"
        >
          ×
        </button>
      )}
      {isOpen && query.trim() && results.length > 0 && (
        <div className="search-results" id="person-search-results" role="listbox">
          {results.map((person) => (
            <button
              aria-selected={false}
              className="search-result"
              key={person.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(person)}
              role="option"
              type="button"
            >
              <span className="search-result-icon" aria-hidden="true">P</span>
              <span className="search-result-copy">
                <span>{person.name}</span>
                <small>{person.reference}</small>
              </span>
              <span aria-hidden="true" className="search-result-arrow">↗</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
