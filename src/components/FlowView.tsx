import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type OnNodeDrag,
  type ReactFlowInstance,
  type Viewport,
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
  FLOW_LOGO_POSITION,
  FLOW_PIPES,
  FLOW_POSITION_BY_STATION_ID,
  FLOW_RIVER_LABELS,
  FLOW_SIBH_LOGO_POSITION,
  endpointNodeId,
} from "@/config/flowDiagram";
import { useStationStatus } from "@/hooks/useStationStatus";
import { useDamStatus } from "@/hooks/useDamStatus";
import AgencyLogoNode, { type AgencyLogoNodeType } from "@/components/flow/AgencyLogoNode";
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
  agencyLogo: AgencyLogoNode,
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

const LOGO_NODE: AgencyLogoNodeType = {
  id: "agency-logo",
  type: "agencyLogo",
  position: FLOW_LOGO_POSITION,
  width: 180,
  height: 119,
  draggable: false,
  selectable: false,
  data: { variant: "spaguas" },
};

// Wordmark SIBH (123×38 de proporção) um pouco menor que a da SP Águas.
const SIBH_LOGO_NODE: AgencyLogoNodeType = {
  id: "sibh-logo",
  type: "agencyLogo",
  position: FLOW_SIBH_LOGO_POSITION,
  width: 140,
  height: 43,
  draggable: false,
  selectable: false,
  data: { variant: "sibh" },
};

/**
 * O React Flow mede o node pela caixa NÃO rotacionada (o `transform:
 * rotate()` do `.flow-river-label` é só visual) — sem isso, o `fitView`
 * "acha" que um rótulo vertical ocupa uma caixa larga e baixa (o texto
 * antes de girar), não a alta e fina que aparece de verdade, e deixa
 * rótulo perto da borda (ex.: "RIO BAQUIRIVU") sair cortado no print.
 * `width`/`height` explícitos no node (estimados a partir do nº de
 * caracteres) corrigem a conta pro `fitView` de verdade — já JÁ
 * TROCADOS (largo↔alto) pros rótulos verticais (`angle === -90`).
 */
function estimateLabelSize(text: string, angle: number): { width: number; height: number } {
  const textLength = text.length * 8.6 + 16; // ~fonte 12px negrito itálico + letter-spacing
  const thickness = 18; // altura de uma linha só
  return angle === 0
    ? { width: textLength, height: thickness }
    : { width: thickness, height: textLength };
}

const LABEL_NODES: Node[] = FLOW_RIVER_LABELS.map((l) => {
  const { width, height } = estimateLabelSize(l.text, l.angle);
  return {
    id: l.id,
    type: "riverLabel",
    position: { x: l.x, y: l.y },
    width,
    height,
    draggable: false,
    selectable: false,
    data: { text: l.text, angle: l.angle },
  };
});

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
  /** Esconde caixas sem nenhuma leitura na janela (mostrando "—") — usado só
   * durante o print (botão de câmera), pra não sair no PNG com traço. */
  hideNoData: boolean;
  /** Igual a `hideNoData` (mesmo `capturing` do App.tsx) — separado porque
   * aciona outra coisa: reenquadra o canvas (fitView) antes do print, pra
   * sair sempre com o diagrama inteiro visível, não o zoom/pan que o
   * usuário tinha no momento (pedido do usuário, 2026-09-12). Some da tela
   * de volta ao zoom/pan original depois que a imagem é gerada. */
  capturing: boolean;
  /** Posições arrastadas manualmente (por id do posto) — vencem a posição
   * curada em `flowDiagram.ts`. Sistema de coordenadas PRÓPRIO do diagrama
   * (x/y do esquema, não lat/lng) — não é o mesmo storage do mapa (pedido
   * do usuário, 2026-09-13). */
  overrides: Record<number, { x: number; y: number }>;
  /** Usuário soltou a caixa numa nova posição — persistir. */
  onDragStation: (stationId: number, pos: { x: number; y: number }) => void;
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
  hideNoData,
  capturing,
  overrides,
  onDragStation,
  onPaneClick,
}: FlowViewProps) {
  const { byId } = useStationStatus(referenceDate);
  const { data: damData } = useDamStatus();

  // Reenquadra (fitView) só na hora do print, pra sair sempre com o
  // diagrama inteiro visível, o mais próximo possível — não o zoom/pan que
  // o usuário tinha no momento (pode estar olhando só um pedaço). Guarda o
  // viewport de antes pra devolver depois que a imagem já foi gerada (o
  // `capturing` só vira `false` no `finally` do `handleCapture`, ou seja,
  // DEPOIS do `downloadElementAsPng` já ter capturado o DOM reenquadrado).
  const rfInstanceRef = useRef<ReactFlowInstance<Node, Edge<PipeEdgeData>> | null>(null);
  const savedViewportRef = useRef<Viewport | null>(null);
  useEffect(() => {
    const inst = rfInstanceRef.current;
    if (!inst) return;
    if (capturing) {
      savedViewportRef.current = inst.getViewport();
      // `width`/`height` explícitos nos LABEL_NODES (ver `estimateLabelSize`)
      // já corrigem a caixa que o fitView usa pros rótulos de rio — esse
      // padding aqui é só uma folga pequena de segurança.
      inst.fitView({ padding: 0.07, duration: 0 });
    } else if (savedViewportRef.current) {
      inst.setViewport(savedViewportRef.current, { duration: 0 });
      savedViewportRef.current = null;
    }
  }, [capturing]);

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
        const curated = pos ?? { x: -300, y: 400 + fallbackIndex++ * 60 };
        // Posição arrastada (se houver) vence a curada — mesmo padrão do
        // mapa (`overrides[id] ?? autoPos ?? anchor`), só que aqui não tem
        // "auto layout", é curada ou arrastada.
        const { x, y } = overrides[s.id] ?? curated;
        const dimmed = hoveredLevel != null && classification !== hoveredLevel;
        return {
          id: String(s.id),
          type: "station" as const,
          position: { x, y },
          draggable: true,
          hidden: hiddenLevels.has(classification) || (hideNoData && status?.series == null),
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
        draggable: false,
        data: {
          barrageId: b.id,
          name: b.name,
          gates,
          selected: b.id === selectedBarrageId,
          onSelect: onSelectBarrage,
        },
      };
    });

    return [...ANCHOR_NODES, ...LABEL_NODES, ...stationNodes, ...barrageNodes, LOGO_NODE, SIBH_LOGO_NODE];
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
    hideNoData,
    overrides,
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

  // Só postos são arrastáveis (`draggable:true` só em `stationNodes` —
  // âncoras/rótulos/barragens/logos continuam `draggable:false`
  // explícito). Persiste em `useFlowStationPositions` (App.tsx), storage
  // próprio do diagrama.
  const handleNodeDragStop: OnNodeDrag<Node> = useCallback(
    (_event, node) => {
      if (node.type !== "station") return;
      const stationId = Number(node.id);
      if (!Number.isFinite(stationId)) return;
      onDragStation(stationId, { x: node.position.x, y: node.position.y });
    },
    [onDragStation],
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
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeDragStop={handleNodeDragStop}
          onPaneClick={onPaneClick}
          onInit={(instance) => {
            rfInstanceRef.current = instance;
          }}
          proOptions={{ hideAttribution: true }}
        >
          {/* `color`/`size` mais fortes que o default AO VIVO — o cinza
              clarinho original (#e2e8f0, raio ~1) ficava quase
              imperceptível no zoom/tamanho de tela normal. No PRINT, porém,
              o mesmo tom mais forte fica "forte demais" (achado do usuário)
              — e a config antiga (clarinha) já saía boa no PNG exportado
              desde sempre (só não aparecia AO VIVO, por causa do bug de
              z-index já corrigido). Por isso o print usa os valores
              originais, só ao vivo fica mais forte. */}
          <Background
            gap={24}
            size={capturing ? 1 : 2.2}
            color={capturing ? "#e2e8f0" : "#94a3b8"}
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
