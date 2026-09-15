/**
 * Tipos compartilhados entre os diagramas curados de cada bacia
 * (`flowDiagram.ts` = Tietê/Pinheiros, `flowDiagramRibeira.ts` = Ribeira de
 * Iguape) — extraídos daqui em 2026-09-14, quando o app ganhou uma 2ª
 * bacia, pra não duplicar a definição das interfaces em cada arquivo.
 */

export interface FlowStationPosition {
  stationId: number;
  x: number;
  y: number;
}

export interface FlowJunction {
  id: string;
  x: number;
  y: number;
}

/** Extremo de uma pipe/leader: id de posto (número) ou de junção (string). */
export type FlowEndpoint = number | string;

export function endpointNodeId(e: FlowEndpoint): string {
  return typeof e === "number" ? String(e) : e;
}

export interface FlowPipe {
  id: string;
  from: FlowEndpoint;
  to: FlowEndpoint;
  /** Nome do rio/trecho — só documentação (não é lido pela renderização),
   * cada bacia usa seu próprio conjunto de nomes. */
  river: string;
}

/** Rótulo (nome do rio) fixado num ponto do cano, com o ângulo de leitura. */
export interface FlowRiverLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  /** Graus de rotação do texto — 0 = horizontal (tronco), 90/-90 = ao longo
   * de um afluente vertical. */
  angle: number;
}

/** Posição de uma barragem no esquema (só existem no fluxo — não têm
 * lat/lng real). Bacias sem barragem monitorada exportam um array vazio.
 * Essas são as INTERATIVAS (status de comporta real via API — só o
 * Tietê tem, ver `data/barrages.ts`/`BarrageNode.tsx`). */
export interface FlowBarragePosition {
  barrageId: string;
  x: number;
  y: number;
}

/** Barragem/estrutura SEM dado real mapeado ainda — só um marcador visual
 * (ícone + nome no hover), sem sidebar/status de comporta (2026-09-15,
 * primeiro uso: as 6 barragens do Rio Juquiá no Ribeira — usuário disse
 * que a lista de postos de monitoramento entra depois). Diferente de
 * `FlowBarragePosition`: não tem `apiDamId`/`gates`, é só decorativo. */
export interface FlowSimpleBarrage {
  id: string;
  name: string;
  x: number;
  y: number;
}

/**
 * Pacote completo de um diagrama curado — o que `FlowView.tsx` precisa pra
 * desenhar uma bacia. Cada bacia (`flowDiagram.ts`/`flowDiagramRibeira.ts`)
 * exporta um objeto desse shape; `config/flowDiagrams.ts` registra os dois
 * por `Region`.
 */
export interface FlowDiagramConfig {
  FLOW_STATION_POSITIONS: FlowStationPosition[];
  FLOW_POSITION_BY_STATION_ID: Map<number, FlowStationPosition>;
  FLOW_JUNCTIONS: FlowJunction[];
  FLOW_PIPES: FlowPipe[];
  FLOW_LEADERS: FlowPipe[];
  FLOW_RIVER_LABELS: FlowRiverLabel[];
  FLOW_BARRAGE_POSITIONS: FlowBarragePosition[];
  FLOW_BARRAGE_POSITION_BY_ID: Map<string, FlowBarragePosition>;
  /** Barragens sem dado real ainda — vazio nas bacias que não têm
   * (default seguro: `FlowView` trata ausência/array vazio igual). */
  FLOW_SIMPLE_BARRAGES: FlowSimpleBarrage[];
  FLOW_LOGO_POSITION: { x: number; y: number };
  FLOW_SIBH_LOGO_POSITION: { x: number; y: number };
}
