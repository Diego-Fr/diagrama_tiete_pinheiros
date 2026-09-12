import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";

/** Mesmo azul usado pro traço sólido dos rios no mapa (`RiversLayer`). */
const RIVER_COLOR = "#1e5fbf";

export interface PipeEdgeData extends Record<string, unknown> {
  /** "pipe" = traço grosso do curso d'água; "leader" = linha fina tracejada
   * até um posto deslocado do cano (ex.: os 2 da Traição). */
  kind: "pipe" | "leader";
  /** Anima a faixa clara "correndo" sobre o cano (mesmo toggle "Animar o
   * sentido da vazão" das configurações, já usado no mapa). Só se aplica a
   * `kind:"pipe"`. */
  animate?: boolean;
}

/**
 * Segmento do esquema de fluxo — ou o "cano" (traço grosso azul, reto entre
 * os dois pontos) ou um "leader" (linha fina tracejada + bolinha na ponta,
 * mesmo padrão visual do leader-line do mapa) pros postos deslocados do
 * cano principal.
 */
export default function PipeEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerStart,
  markerEnd,
}: EdgeProps) {
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  const edgeData = data as PipeEdgeData | undefined;
  const kind = edgeData?.kind ?? "pipe";

  if (kind === "leader") {
    return (
      <>
        <BaseEdge
          path={path}
          markerStart={markerStart}
          markerEnd={markerEnd}
          style={{
            stroke: "#111827",
            strokeWidth: 1.2,
            strokeDasharray: "3 3",
            opacity: 0.8,
          }}
        />
        <circle cx={sourceX} cy={sourceY} r={3} fill="#111827" stroke="#fff" strokeWidth={1} />
      </>
    );
  }

  return (
    <>
      <BaseEdge
        path={path}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{
          stroke: RIVER_COLOR,
          strokeWidth: 10,
          strokeLinecap: "round",
        }}
      />
      {edgeData?.animate && (
        <path
          d={path}
          className="flow-pipe-anim"
          fill="none"
          stroke="#8fc4ff"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="4 14"
        />
      )}
    </>
  );
}
