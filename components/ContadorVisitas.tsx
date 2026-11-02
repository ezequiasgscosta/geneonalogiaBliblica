"use client";

import { useEffect, useState } from "react";

const VISIT_COUNT_KEY = "genealogy-visit-count";
const VISIT_SESSION_KEY = "genealogy-visit-counted";

export function ContadorVisitas() {
  const [visitCount, setVisitCount] = useState<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedCount = localStorage.getItem(VISIT_COUNT_KEY);
        const count = savedCount === null ? 0 : Number(savedCount);

        if (!Number.isSafeInteger(count) || count < 0) {
          throw new Error("O contador de visitas salvo no navegador é inválido.");
        }

        if (sessionStorage.getItem(VISIT_SESSION_KEY) === null) {
          const nextCount = count + 1;
          localStorage.setItem(VISIT_COUNT_KEY, String(nextCount));
          sessionStorage.setItem(VISIT_SESSION_KEY, "true");
          setVisitCount(nextCount);
          return;
        }

        setVisitCount(count);
      } catch (error) {
        console.error("Não foi possível carregar o contador de visitas.", error);
      }
    });
  }, []);

  return (
    <div
      aria-label={
        visitCount === null
          ? "Contador de visitas neste navegador"
          : `${visitCount} ${visitCount === 1 ? "visita" : "visitas"} neste navegador`
      }
      aria-live="polite"
      className="visit-counter"
      title="Contagem salva somente neste navegador"
    >
      <span className="visit-counter-label">Visitas</span>
      <span className="visit-counter-value">
        {visitCount === null ? "—" : visitCount.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}
