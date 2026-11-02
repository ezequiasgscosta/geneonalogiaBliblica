"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { BIBLICAL_NODES, ROOT_PERSON_ID } from "@/data/biblia";
import { BarraPesquisa } from "@/components/BarraPesquisa";
import { NoBiblico } from "@/components/NoBiblico";
import { PainelPersonagem } from "@/components/PainelPersonagem";
import type { BiblePerson, PersonEdge, PositionedPerson } from "@/data/biblia";

const NODE_HEIGHT = 54;
const HORIZONTAL_GAP = 196;
const VERTICAL_GAP = 94;
const SIBLING_ORDER: Record<string, string[]> = {
  "adao-e-eva": ["caim", "abel", "sete"],
  noe: ["sem", "cam", "jafe"],
  abraao: ["ismael", "isaque"],
  isaque: ["esau", "jaco"],
  jaco: [
    "ruben",
    "simeao",
    "levi",
    "juda",
    "dan",
    "naftali",
    "gad",
    "aser",
    "issacar",
    "zebulom",
    "jose",
    "benjamim",
  ],
  levi: ["gerson", "coat", "merari"],
  anrao: ["miriam", "arao", "moises"],
  jose: ["manasses", "efraim"],
  davi: ["natam", "salomao"],
  jesus: [
    "joao-batista",
    "pedro",
    "andre",
    "tiago-zebedeu",
    "joao-apostolo",
    "filipe-apostolo",
    "bartolomeu",
    "tome",
    "mateus",
    "tiago-alfeu",
    "tadeu",
    "simao-zelote",
    "judas-iscariotes",
    "paulo",
    "estevao",
    "filipe-evangelista",
  ],
};

function createTree(
  peopleById: Map<string, BiblePerson>,
  childrenById: Map<string, BiblePerson[]>,
) {
  const positions = new Map<string, PositionedPerson>();
  const edges: PersonEdge[] = [];
  const root = peopleById.get(ROOT_PERSON_ID);
  const levels: BiblePerson[][] = root ? [[root]] : [];
  const visited = new Set(root ? [root.id] : []);

  for (let depth = 0; depth < levels.length; depth += 1) {
    const level = levels[depth];
    level.forEach((person, index) => {
      positions.set(person.id, {
        person,
        x: (index - (level.length - 1) / 2) * HORIZONTAL_GAP,
        y: 58 + depth * VERTICAL_GAP,
        childCount: (childrenById.get(person.id) ?? []).length,
      });
    });

    const nextLevel = level.flatMap((person) =>
      (childrenById.get(person.id) ?? []).filter((child) => {
        if (visited.has(child.id)) return false;
        visited.add(child.id);
        return true;
      }),
    );
    if (nextLevel.length > 0) levels.push(nextLevel);
  }

  for (const positioned of positions.values()) {
    const parentId = positioned.person.connectionId;
    const parent = parentId ? positions.get(parentId) : undefined;
    if (parent) {
      edges.push({
        id: `${parent.person.id}-${positioned.person.id}`,
        from: parent,
        to: positioned,
      });
    }
  }

  const width = Math.max(900, ...levels.map((level) => level.length * HORIZONTAL_GAP));
  const height = Math.max(650, levels.length * VERTICAL_GAP + 80);
  return { positions, edges, width, height };
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function ArvoreBiblica() {
  const peopleById = useMemo(
    () => new Map(BIBLICAL_NODES.map((person) => [person.id, person])),
    [],
  );
  const childrenById = useMemo(() => {
    const children = new Map<string, BiblePerson[]>();
    for (const person of BIBLICAL_NODES) {
      if (!person.connectionId) continue;
      const current = children.get(person.connectionId) ?? [];
      current.push(person);
      children.set(person.connectionId, current);
    }
    for (const [parentId, siblings] of children) {
      const order = SIBLING_ORDER[parentId];
      if (!order) continue;
      const rank = new Map(order.map((id, index) => [id, index]));
      siblings.sort(
        (a, b) =>
          (rank.get(a.id) ?? order.length) - (rank.get(b.id) ?? order.length),
      );
    }
    return children;
  }, []);
  const tree = useMemo(
    () => createTree(peopleById, childrenById),
    [childrenById, peopleById],
  );
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 32, scale: 0.8 });
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 560 });
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const initialCenterApplied = useRef(false);
  const previousWidth = useRef(900);
  const drag = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return [];
    return BIBLICAL_NODES.filter((person) =>
      normalize(`${person.name} ${person.description} ${person.reference}`).includes(term),
    )
      .sort(
        (a, b) =>
          Number(!normalize(a.name).startsWith(term)) -
            Number(!normalize(b.name).startsWith(term)) ||
          a.name.localeCompare(b.name, "pt-BR"),
      )
      .slice(0, 7);
  }, [query]);

  const selectedPerson = selectedId ? peopleById.get(selectedId) ?? null : null;
  const selectedParent = selectedPerson?.connectionId
    ? peopleById.get(selectedPerson.connectionId) ?? null
    : null;
  const selectedChildren = selectedPerson
    ? childrenById.get(selectedPerson.id) ?? []
    : [];
  const rootPosition = tree.positions.get(ROOT_PERSON_ID);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.max(320, entry.contentRect.width);
      const height = Math.max(400, entry.contentRect.height);
      setCanvasSize({ width, height });
      if (!initialCenterApplied.current && rootPosition) {
        initialCenterApplied.current = true;
        setViewport((current) => ({
          ...current,
          x: width / 2 - rootPosition.x * current.scale,
        }));
      } else if (initialCenterApplied.current) {
        const difference = width - previousWidth.current;
        if (difference) {
          setViewport((current) => ({ ...current, x: current.x + difference / 2 }));
        }
      }
      previousWidth.current = width;
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [rootPosition]);

  const zoomBy = useCallback(
    (factor: number, anchorX = canvasSize.width / 2, anchorY = canvasSize.height / 2) => {
      setViewport((current) => {
        const scale = Math.max(0.18, Math.min(1.5, current.scale * factor));
        const ratio = scale / current.scale;
        return {
          scale,
          x: anchorX - (anchorX - current.x) * ratio,
          y: anchorY - (anchorY - current.y) * ratio,
        };
      });
    },
    [canvasSize.height, canvasSize.width],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      zoomBy(
        event.deltaY < 0 ? 1.08 : 0.92,
        event.clientX - bounds.left,
        event.clientY - bounds.top,
      );
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoomBy]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("person-search-input")?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function focusPerson(id: string) {
    const positioned = tree.positions.get(id);
    if (!positioned) return;
    setSelectedId(id);
    setHighlightedId(id);
    setQuery(positioned.person.name);
    setViewport((current) => ({
      ...current,
      x: canvasSize.width / 2 - positioned.x * current.scale,
      y: canvasSize.height * 0.36 - positioned.y * current.scale,
    }));
  }

  function resetView() {
    if (!rootPosition) return;
    setSelectedId(null);
    setHighlightedId(null);
    setQuery("");
    setViewport((current) => ({
      ...current,
      x: canvasSize.width / 2 - rootPosition.x * current.scale,
      y: 28,
    }));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button, [data-person]")) return;
    if (event.button !== 0) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current.pointerId !== event.pointerId) return;
    setViewport((current) => ({
      ...current,
      x: drag.current.originX + event.clientX - drag.current.startX,
      y: drag.current.originY + event.clientY - drag.current.startY,
    }));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current.pointerId !== event.pointerId) return;
    drag.current.pointerId = -1;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  }

  return (
    <main className="genealogy-app">
      <header className="genealogy-header">
        <div className="genealogy-title">
          <span aria-hidden="true" className="genealogy-mark">Á</span>
          <div>
            <p>UMA ÁRVORE DE PESSOAS</p>
            <h1>Deus <span>até</span> Apocalipse</h1>
          </div>
        </div>
        <div className="genealogy-search">
          <BarraPesquisa
            onQueryChange={setQuery}
            onSelect={(person) => focusPerson(person.id)}
            query={query}
            results={results}
          />
          <kbd>Ctrl K</kbd>
        </div>
      </header>

      <section aria-label="Genealogia bíblica completa" className="genealogy-card">
        <div className="genealogy-card-heading">
          <div>
            <h2>Genealogia bíblica</h2>
            <p>Todas as {BIBLICAL_NODES.length} pessoas aparecem de uma vez</p>
          </div>
          <span className="all-loaded"><i /> Árvore completa</span>
        </div>

        <div
          aria-label="Árvore genealógica. Arraste para navegar e use a roda do mouse para aproximar."
          className={`genealogy-canvas ${isDragging ? "is-dragging" : ""}`}
          onLostPointerCapture={() => setIsDragging(false)}
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={canvasRef}
          role="application"
          tabIndex={0}
        >
          <svg
            className="genealogy-svg"
            role="img"
            viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
          >
            <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
              <g aria-hidden="true" className="genealogy-edges">
                {tree.edges.map(({ id, from, to }) => {
                  const startY = from.y + NODE_HEIGHT / 2;
                  const endY = to.y - NODE_HEIGHT / 2;
                  const midY = (startY + endY) / 2;
                  const path =
                    from.x === to.x
                      ? `M ${from.x} ${startY} V ${endY}`
                      : `M ${from.x} ${startY} V ${midY} H ${to.x} V ${endY}`;
                  return <path d={path} key={id} />;
                })}
              </g>
              <g>
                {[...tree.positions.values()].map((position) => (
                  <NoBiblico
                    isHighlighted={highlightedId === position.person.id}
                    isSelected={selectedId === position.person.id}
                    key={position.person.id}
                    onOpen={focusPerson}
                    position={position}
                  />
                ))}
              </g>
            </g>
          </svg>

          <div className="genealogy-zoom" aria-label="Controles de zoom">
            <button aria-label="Aproximar" onClick={() => zoomBy(1.2)} type="button">+</button>
            <span aria-live="polite">{Math.round(viewport.scale * 100)}%</span>
            <button aria-label="Afastar" onClick={() => zoomBy(0.84)} type="button">−</button>
            <i />
            <button aria-label="Voltar ao início da árvore" onClick={resetView} type="button">↺</button>
          </div>
          <p className="genealogy-hint">Arraste para navegar <span>·</span> Selecione uma pessoa para ver o parentesco</p>
        </div>
        <footer className="genealogy-footer">
          <span><i className="line-legend" /> Linhas indicam a relação descrita entre as pessoas</span>
          <span>Gênesis 1–Apocalipse 22</span>
        </footer>
      </section>

      {selectedPerson && (
        <>
          <button
            aria-label="Fechar detalhes"
            className="genealogy-backdrop"
            onClick={() => setSelectedId(null)}
            type="button"
          />
          <PainelPersonagem
            descendants={selectedChildren}
            onClose={() => setSelectedId(null)}
            parent={selectedParent}
            person={selectedPerson}
            onNavigate={focusPerson}
          />
        </>
      )}

    </main>
  );
}
