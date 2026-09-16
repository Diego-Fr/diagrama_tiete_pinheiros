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
import type { Barrage } from "@/data/barrages";
import type { BoxFormat } from "@/lib/boxFormat";
import type { LevelClass } from "@/lib/classification";
import type { Region, StationPoint } from "@/types/station";
import { endpointNodeId, type FlowDiagramConfig } from "@/config/flowShared";
import { REGION_JUSANTE_IDS } from "@/data/stations";
import { useStationStatus } from "@/hooks/useStationStatus";
import { useDamStatus } from "@/hooks/useDamStatus";
import { useMeasurements } from "@/hooks/useMeasurements";
import AgencyLogoNode, { type AgencyLogoNodeType } from "@/components/flow/AgencyLogoNode";
import AnchorNode from "@/components/flow/AnchorNode";
import BarrageNode, { type BarrageNode as BarrageNodeType } from "@/components/flow/BarrageNode";
import PipeEdge, { type PipeEdgeData } from "@/components/flow/PipeEdge";
import ReservoirStationNode, {
  type ReservoirStationNode as ReservoirStationNodeType,
} from "@/components/flow/ReservoirStationNode";
import RiverBarrageNode, {
  type RiverBarrageNodeType,
} from "@/components/flow/RiverBarrageNode";
import RiverLabelNode from "@/components/flow/RiverLabelNode";
import StationFlowNode, {
  type StationNode,
} from "@/components/flow/StationFlowNode";

const nodeTypes: NodeTypes = {
  station: StationFlowNode,
  reservoirStation: ReservoirStationNode,
  anchor: AnchorNode,
  riverLabel: RiverLabelNode,
  barrage: BarrageNode,
  riverBarrage: RiverBarrageNode,
  agencyLogo: AgencyLogoNode,
};
const edgeTypes: EdgeTypes = { pipe: PipeEdge };

/**
 * Nós fixos do esquema (âncoras/rótulos/logos) — funções, não mais
 * constantes de módulo (2026-09-14: cada bacia tem seu próprio
 * `FlowDiagramConfig`, então dependem do `flowDiagram` ativo — viram
 * `useMemo` dentro do componente, recalculados só quando a área de
 * interesse muda).
 */
function buildAnchorNodes(flowDiagram: FlowDiagramConfig): Node[] {
  return flowDiagram.FLOW_JUNCTIONS.map((j) => ({
    id: j.id,
    type: "anchor",
    position: { x: j.x, y: j.y },
    draggable: false,
    selectable: false,
    data: {},
  }));
}

function buildLogoNodes(flowDiagram: FlowDiagramConfig): AgencyLogoNodeType[] {
  return [
    {
      id: "agency-logo",
      type: "agencyLogo",
      position: flowDiagram.FLOW_LOGO_POSITION,
      width: 180,
      height: 119,
      draggable: false,
      selectable: false,
      data: { variant: "spaguas" },
    },
    // Wordmark SIBH (123×38 de proporção) um pouco menor que a da SP Águas.
    {
      id: "sibh-logo",
      type: "agencyLogo",
      position: flowDiagram.FLOW_SIBH_LOGO_POSITION,
      width: 140,
      height: 43,
      draggable: false,
      selectable: false,
      data: { variant: "sibh" },
    },
  ];
}

/** Barragens sem dado real ainda (2026-09-15) — ícone estático
 * (`RiverBarrageNode.tsx`), não-interativo, sobre o próprio cano (mesmo
 * truque das barragens "de verdade" — o cano passa por baixo,
 * contínuo). Vazio nas bacias sem nenhuma (`FLOW_SIMPLE_BARRAGES: []`). */
function buildRiverBarrageNodes(flowDiagram: FlowDiagramConfig): RiverBarrageNodeType[] {
  return flowDiagram.FLOW_SIMPLE_BARRAGES.map((b) => ({
    id: b.id,
    type: "riverBarrage",
    position: { x: b.x, y: b.y },
    width: 81,
    height: 81,
    // z-index explícito (2026-09-15) — precisa ficar ABAIXO do leader
    // (linha+bolinha, zIndex:1 nos edges) e das caixas (zIndex:2), pra
    // arrastar um posto de reservatório sobre uma UHE vizinha não esconda
    // o leader atrás do ícone estático da barragem. Ver `edges`/`nodes`
    // mais abaixo pros outros dois números dessa pilha.
    zIndex: 0,
    draggable: false,
    selectable: false,
    data: { name: b.name },
  }));
}

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

function buildLabelNodes(flowDiagram: FlowDiagramConfig): Node[] {
  return flowDiagram.FLOW_RIVER_LABELS.map((l) => {
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
}

function buildEdgeDefs(flowDiagram: FlowDiagramConfig) {
  return [
    ...flowDiagram.FLOW_PIPES.map((p) => ({ ...p, kind: "pipe" as const })),
    ...flowDiagram.FLOW_LEADERS.map((l) => ({ ...l, kind: "leader" as const })),
  ];
}

interface FlowViewProps {
  /** Bacia ativa — só usada pra buscar `REGION_JUSANTE_IDS[region]` (dado
   * extra de jusante das UHEs de reservatório, 2026-09-15). */
  region: Region;
  /** Postos da área de interesse ativa (`REGION_STATIONS[region]`). */
  stations: StationPoint[];
  /** Ids da mesma lista — referência estável (`REGION_STATION_IDS[region]`). */
  stationIds: number[];
  /** Pacote curado da área de interesse ativa (`FLOW_DIAGRAMS[region]`). */
  flowDiagram: FlowDiagramConfig;
  /** Barragens a desenhar — vazio pra bacias sem estrutura monitorada
   * (2026-09-14: Ribeira de Iguape não tem nenhuma conhecida). */
  barrages: Barrage[];
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
  region,
  stations,
  stationIds,
  flowDiagram,
  barrages,
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
  const { byId } = useStationStatus(stations, stationIds, referenceDate);
  // `barrages` só vem preenchida no Tietê (única bacia com comporta com
  // telemetria real hoje) — sem `enabled`, `/v1/dams` era consultada (e
  // reconsultada a cada 60s) também com a Ribeira aberta, sem uso nenhum
  // (2026-09-15, pedido do usuário).
  const { data: damData } = useDamStatus(barrages.length > 0);
  // Dado extra de JUSANTE das UHEs de reservatório (2026-09-15) — ids
  // auxiliares (`REGION_JUSANTE_IDS`, vazio no Tietê) que não são postos
  // próprios, só telemetria a mais pra 4ª linha do `ReservoirStationNode`.
  // Mesmo hook genérico (`useMeasurements`) usado pro resto do app —
  // `REGION_JUSANTE_IDS[region]` é referência estável (módulo), então bate
  // com a regra de queryKey de `useMeasurements` (não recriar array a cada
  // render).
  const { data: jusanteData } = useMeasurements(REGION_JUSANTE_IDS[region], referenceDate);

  // Recalculados só quando a área de interesse muda (2026-09-14) — antes
  // eram constantes de módulo fixas no Tietê.
  const anchorNodes = useMemo(() => buildAnchorNodes(flowDiagram), [flowDiagram]);
  const labelNodes = useMemo(() => buildLabelNodes(flowDiagram), [flowDiagram]);
  const logoNodes = useMemo(() => buildLogoNodes(flowDiagram), [flowDiagram]);
  const riverBarrageNodes = useMemo(
    () => buildRiverBarrageNodes(flowDiagram),
    [flowDiagram],
  );
  const edgeDefs = useMemo(() => buildEdgeDefs(flowDiagram), [flowDiagram]);

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

  // Reenquadra ao TROCAR de diagrama (2026-09-16, pedido do usuário: "se
  // vc for trocar de um diagrama para o outro, tem que disparar um
  // fitview") — trocar de bacia (Tietê↔Ribeira) NÃO desmonta o
  // `<FlowView>` (só troca `flowDiagram`/`stations` via prop, `App.tsx`
  // não usa `key`), então o `fitView` do `<ReactFlow>` (só roda 1x, no
  // mount) nunca disparava de novo — o zoom/pan ficava o mesmo de antes,
  // errado pro sistema de coordenadas da bacia nova (cada uma tem o seu
  // próprio, sem relação com o da outra). `flowDiagram` já é a referência
  // certa pra depender disso: muda 1x por bacia (`FLOW_DIAGRAMS[region]`,
  // estável). Não dispara durante `capturing` (o efeito acima já cuida
  // do fitView do print, não tem por que os dois brigarem).
  useEffect(() => {
    const inst = rfInstanceRef.current;
    if (!inst || capturing) return;
    inst.fitView({ padding: 0.07, duration: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowDiagram]);

  const nodes: Node[] = useMemo(() => {
    let fallbackIndex = 0;
    const stationNodes: (StationNode | ReservoirStationNodeType)[] = stations
      .map((s) => {
        const status = byId.get(s.id);
        const classification = status?.classification ?? "normal";
        const pos = flowDiagram.FLOW_POSITION_BY_STATION_ID.get(s.id);
        if (!pos) {
          // Posto novo, ainda sem lugar curado no esquema — empilha à parte
          // em vez de sumir, pra não passar despercebido.
          console.warn(
            `Posto ${s.id} (${s.name}) sem posição no diagrama curado — usando posição de reserva.`,
          );
        }
        const curated = pos ?? { x: -300, y: 400 + fallbackIndex++ * 60 };
        // Posição arrastada (se houver) vence a curada — mesmo padrão do
        // mapa (`overrides[id] ?? autoPos ?? anchor`), só que aqui não tem
        // "auto layout", é curada ou arrastada.
        const { x, y } = overrides[s.id] ?? curated;
        const dimmed = hoveredLevel != null && classification !== hoveredLevel;
        const hidden = hiddenLevels.has(classification) || (hideNoData && status?.series == null);
        const style = { opacity: dimmed ? 0.12 : 1, transition: "opacity 140ms ease" };

        // Postos de nível de RESERVATÓRIO de UHE (2026-09-15, Ribeira de
        // Iguape) — caixa bem diferente (3 linhas empilhadas, ver
        // `ReservoirStationNode.tsx`), marcados via `station_subtype` no
        // raw JSON (`data/stations.ts` copia pra `StationPoint.subtype`).
        if (s.subtype === "reservatorio") {
          return {
            id: String(s.id),
            type: "reservoirStation" as const,
            position: { x, y },
            draggable: true,
            hidden,
            style,
            // z-index explícito — precisa ficar ACIMA da barragem (0) e do
            // leader (1) que passam pelo mesmo ponto/cruzam a caixa ao
            // arrastar (ver `buildRiverBarrageNodes`/`edges`, 2026-09-15).
            zIndex: 2,
            data: {
              stationId: s.id,
              name: s.name,
              series: status?.series ?? null,
              // Dado de jusante (4ª linha, 2026-09-15) — só as 5 UHEs com
              // `jusanteStationId` mapeado têm algo aqui; as outras 3 ficam
              // `null` (linha mostra "–", tratado no componente).
              jusanteSeries:
                s.jusanteStationId != null
                  ? (jusanteData?.get(s.jusanteStationId) ?? null)
                  : null,
              classification,
              freshness: status?.freshness ?? null,
              format: boxFormat,
              selected: s.id === selectedId,
              onSelect: onSelectStation,
            },
          };
        }

        return {
          id: String(s.id),
          type: "station" as const,
          position: { x, y },
          draggable: true,
          hidden,
          style,
          zIndex: 2,
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
      const pos = flowDiagram.FLOW_BARRAGE_POSITION_BY_ID.get(b.id);
      if (!pos) {
        console.warn(`Barragem ${b.id} (${b.name}) sem posição no diagrama curado.`);
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

    return [
      ...anchorNodes,
      ...labelNodes,
      ...barrageNodes,
      // riverBarrageNodes ANTES de stationNodes — postos que ficam "no
      // meio" de uma UHE (Rio Juquiá-Guaçu, 2026-09-15) precisam
      // desenhar a caixa POR CIMA do ícone da barragem, não embaixo
      // (React Flow empilha na ordem do array — o que vem depois fica
      // acima).
      ...riverBarrageNodes,
      ...stationNodes,
      ...logoNodes,
    ];
  }, [
    stations,
    flowDiagram,
    barrages,
    anchorNodes,
    labelNodes,
    logoNodes,
    riverBarrageNodes,
    byId,
    damData,
    jusanteData,
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
      edgeDefs.map((e) => ({
        id: e.id,
        type: "pipe",
        source: endpointNodeId(e.from),
        target: endpointNodeId(e.to),
        data: { kind: e.kind, animate: e.kind === "pipe" && riverFlow },
        selectable: false,
        focusable: false,
        // Leader (tracejado + bolinha) por padrão do React Flow fica na
        // camada de edges, ATRÁS de todo node (inclusive os estáticos tipo
        // `riverBarrage`) — sem isso a bolinha/linha some quando cruza por
        // cima de um ícone de barragem (2026-09-15, achado do usuário
        // arrastando as caixas de reservatório). Pilha final (menor→maior):
        // barragem (zIndex:0, `buildRiverBarrageNodes`) < leader (1, aqui)
        // < caixa de posto (2, `stationNodes`/`reservoirStation` abaixo) —
        // 1000 de uma tentativa anterior ficava ACIMA até das caixas
        // também, escondendo o texto atrás do tracejado; corrigido pro
        // valor certo, só entre as duas. Só afeta leaders — o "pipe" grosso
        // do rio deve continuar atrás das caixas, como sempre foi.
        zIndex: e.kind === "leader" ? 1 : undefined,
      })),
    [edgeDefs, riverFlow],
  );

  // Só postos são arrastáveis (`draggable:true` em `stationNodes` —
  // tanto `"station"` quanto `"reservoirStation"`, ver `nodes` acima —
  // âncoras/rótulos/barragens/logos continuam `draggable:false`
  // explícito). Persiste em `useFlowStationPositions` (App.tsx), storage
  // próprio do diagrama.
  const handleNodeDragStop: OnNodeDrag<Node> = useCallback(
    (_event, node) => {
      if (node.type !== "station" && node.type !== "reservoirStation") return;
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
