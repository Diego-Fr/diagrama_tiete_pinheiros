import { useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { fluviometricStations } from "@/data/stations";
import { barrages } from "@/data/barrages";
import type { BoxFormat } from "@/lib/boxFormat";
import type { LevelClass } from "@/lib/classification";
import {
  FLOW_BARRAGE_POSITION_BY_ID,
  FLOW_JUNCTIONS,
  FLOW_LEADERS,
  FLOW_PIPES,
  FLOW_POSITION_BY_STATION_ID,
  FLOW_RIVER_LABELS,
  endpointNodeId,
} from "@/config/flowDiagram";
import { useStationStatus } from "@/hooks/useStationStatus";
import { useDamStatus } from "@/hooks/useDamStatus";
import AnchorNode from "@/components/flow/AnchorNode";
import BarrageNode, { type BarrageNode as BarrageNodeType } from "@/components/flow/BarrageNode";
import PipeEdge, { type PipeEdgeData } from "@/components/flow/PipeEdge";
import RiverLabelNode from "@/components/flow/RiverLabelNode";
import StationFlowNode, {
  type StationNode,
} from "@/components/flow/StationFlowNode";

const nodeTypes: NodeTypes = {
  station: StationFlowNode,
  anchor: AnchorNode,
  riverLabel: RiverLabelNode,
  barrage: BarrageNode,
};
const edgeTypes: EdgeTypes = { pipe: PipeEdge };

const ANCHOR_NODES: Node[] = FLOW_JUNCTIONS.map((j) => ({
  id: j.id,
  type: "anchor",
  position: { x: j.x, y: j.y },
  draggable: false,
  selectable: false,
  data: {},
}));

const LABEL_NODES: Node[] = FLOW_RIVER_LABELS.map((l) => ({
  id: l.id,
  type: "riverLabel",
  position: { x: l.x, y: l.y },
  draggable: false,
  selectable: false,
  data: { text: l.text, angle: l.angle },
}));

const ALL_EDGE_DEFS = [
  ...FLOW_PIPES.map((p) => ({ ...p, kind: "pipe" as const })),
  ...FLOW_LEADERS.map((l) => ({ ...l, kind: "leader" as const })),
];

interface FlowViewProps {
  /** null = agora (ao vivo); data fixa = janela de 6h congelada nela. */
  referenceDate: Date | null;
  boxFormat: BoxFormat;
  /** Anima a faixa de vazão nos canos — mesmo toggle usado no mapa. */
  riverFlow: boolean;
  selectedId: number | null;
  onSelectStation: (stationId: number) => void;
  selectedBarrageId: string | null;
  onSelectBarrage: (barrageId: string) => void;
  /** Nível sob hover na legenda — desbota as caixas de outros níveis (mesmo
   * comportamento do mapa). */
  hoveredLevel: LevelClass | null;
  /** Níveis ocultados na legenda — suas caixas não aparecem. */
  hiddenLevels: Set<LevelClass>;
  /** Clique em área vazia do canvas. */
  onPaneClick: () => void;
}

/**
 * Diagrama de fluxo: esquema reto (tronco do Tietê + afluentes) curado em
 * `flowDiagram.ts` — caixas de posto com dado real (mesmo que o mapa),
 * canos com nome do rio + animação de vazão, e clique abrindo a mesma
 * sidebar/modal do mapa.
 */
export default function FlowView({
  referenceDate,
  boxFormat,
  riverFlow,
  selectedId,
  onSelectStation,
  selectedBarrageId,
  onSelectBarrage,
  hoveredLevel,
  hiddenLevels,
  onPaneClick,
}: FlowViewProps) {
  const { byId } = useStationStatus(referenceDate);
  const { data: damData } = useDamStatus();

  const nodes: Node[] = useMemo(() => {
    let fallbackIndex = 0;
    const stationNodes: StationNode[] = fluviometricStations
      .map((s) => {
        const status = byId.get(s.id);
        const classification = status?.classification ?? "normal";
        const pos = FLOW_POSITION_BY_STATION_ID.get(s.id);
        if (!pos) {
          // Posto novo, ainda sem lugar curado no esquema — empilha à parte
          // em vez de sumir, pra não passar despercebido.
          console.warn(
            `Posto ${s.id} (${s.name}) sem posição em flowDiagram.ts — usando posição de reserva.`,
          );
        }
        const { x, y } = pos ?? { x: -300, y: 400 + fallbackIndex++ * 60 };
        const dimmed = hoveredLevel != null && classification !== hoveredLevel;
        return {
          id: String(s.id),
          type: "station" as const,
          position: { x, y },
          hidden: hiddenLevels.has(classification),
          style: { opacity: dimmed ? 0.12 : 1, transition: "opacity 140ms ease" },
          data: {
            stationId: s.id,
            name: s.name,
            series: status?.series ?? null,
            classification,
            freshness: status?.freshness ?? null,
            format: boxFormat,
            selected: s.id === selectedId,
            onSelect: onSelectStation,
          },
        };
      });

    const barrageNodes: BarrageNodeType[] = barrages.map((b) => {
      const pos = FLOW_BARRAGE_POSITION_BY_ID.get(b.id);
      if (!pos) {
        console.warn(`Barragem ${b.id} (${b.name}) sem posição em flowDiagram.ts.`);
      }
      const { x, y } = pos ?? { x: -300, y: 400 + fallbackIndex++ * 60 };
      // Dado real (/sibh/api/v1/dams) quando disponível; senão, fallback
      // pelo gateCount curado, todas assumidas abertas.
      const gates = damData?.get(b.apiDamId)?.gates ?? Array.from(
        { length: b.gateCount },
        (_, i) => ({ id: String(i + 1), open: true }),
      );
      return {
        id: `barrage-${b.id}`,
        type: "barrage",
        position: { x, y },
        data: {
          barrageId: b.id,
          name: b.name,
          gates,
          selected: b.id === selectedBarrageId,
          onSelect: onSelectBarrage,
        },
      };
    });

    return [...ANCHOR_NODES, ...LABEL_NODES, ...stationNodes, ...barrageNodes];
  }, [
    byId,
    damData,
    boxFormat,
    selectedId,
    onSelectStation,
    selectedBarrageId,
    onSelectBarrage,
    hoveredLevel,
    hiddenLevels,
  ]);

  const edges: Edge<PipeEdgeData>[] = useMemo(
    () =>
      ALL_EDGE_DEFS.map((e) => ({
        id: e.id,
        type: "pipe",
        source: endpointNodeId(e.from),
        target: endpointNodeId(e.to),
        data: { kind: e.kind, animate: e.kind === "pipe" && riverFlow },
        selectable: false,
        focusable: false,
      })),
    [riverFlow],
  );

  return (
    <div className="flow-root">
      <div className="flow-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodeOrigin={[0.5, 0.5]}
          fitView
          minZoom={0.15}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onPaneClick={onPaneClick}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} color="#e2e8f0" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
