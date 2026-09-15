import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { StationSeries } from "@/api/measurements";
import type { BoxFormat } from "@/lib/boxFormat";
import type { LevelClass } from "@/lib/classification";
import { formatFullDateTimeBR } from "@/lib/datetime";
import { FRESHNESS_LABELS, type Freshness } from "@/lib/freshness";
import { formatFlow, formatMeters } from "@/lib/stationFormat";
import { CENTERED_HANDLE_STYLE } from "@/components/flow/handleStyle";

export interface ReservoirStationNodeData extends Record<string, unknown> {
  stationId: number;
  name: string;
  series: StationSeries | null;
  /** Série do posto de JUSANTE dessa UHE (2026-09-15) — `null` quando essa
   * UHE não tem jusante monitorada (3 das 8 não têm, ver
   * `REGION_JUSANTE_IDS`/`StationPoint.jusanteStationId`). */
  jusanteSeries: StationSeries | null;
  classification: LevelClass;
  freshness: Freshness | null;
  /** Só usado pro nome (linha extra acima, formato "completo") — as outras
   * 3 diferenças por formato da caixa normal (mín/máx, tendência/unidade)
   * não se aplicam aqui, ver `ReservoirStationNode` (2026-09-15, pedido do
   * usuário: "nos outros formatos manter como está"). */
  format: BoxFormat;
  selected: boolean;
  onSelect: (stationId: number) => void;
}

export type ReservoirStationNode = Node<ReservoirStationNodeData, "reservoirStation">;

/**
 * Caixa dos postos que monitoram NÍVEL DE RESERVATÓRIO de uma UHE
 * (2026-09-15, Ribeira de Iguape — Rio Juquiá-Guaçu) — formato bem
 * diferente da caixa normal de posto (`StationFlowNode.tsx`). **4 linhas
 * empilhadas** (redesenhado no mesmo dia, revisão do layout original de 3):
 * 1. rótulo "cota" (azul — trocado de verde no mesmo dia, "tons de azul
 *    para cota" —, bem pequeno, só separador visual);
 * 2. valor da cota (o dado que o app já tem, `station_subtype:
 *    "reservatorio"` no raw JSON) — mesmo formato da caixa normal
 *    (`"${value} m"`, sem seta de tendência), fonte 2pt menor que a
 *    "linha 2" de uma tentativa anterior (9px em vez de 11, "tava
 *    grandinho");
 * 3. rótulo "jusante" (vermelho fraco, mesmo tamanho pequeno da linha 1);
 * 4. valor da jusante — `jusanteSeries` (`StationPoint.jusanteStationId`
 *    → `REGION_JUSANTE_IDS` → busca extra em `FlowView`), "–" quando essa
 *    UHE não tem jusante monitorada (3 das 8 não têm). **Vazão
 *    (`Reading.flow`, de `read_value` na API) quando disponível**
 *    (2026-09-15, pedido do usuário — regra restrita à jusante, não à
 *    cota): mostra `"X m³/s"` em vez de `"X m"` — a leitura de jusante de
 *    uma UHE é tipicamente sobre quanto está sendo liberado (vazão), não
 *    o nível em si, então quando a API manda isso é a informação mais
 *    relevante ali.
 *
 * Sem seta de tendência em nenhuma das duas (pedido original "sai a
 * seta", mantido). Caixa mais estreita e mais alta que a caixa normal.
 * Mesma classificação por cor/selo de atraso que os postos normais (a
 * cor de fundo/borda do `.reservoir-box` reflete a classificação da
 * COTA — não existe classificação separada pra jusante ainda).
 *
 * **Nome no formato "completo"** (2026-09-15, pedido do usuário —
 * "nos outros formatos manter como está"): mesma ideia do `showName` da
 * caixa normal (`StationFlowNode`), uma linha extra com o nome do posto
 * ACIMA de tudo — só quando `format === "completo"`; nos outros 3
 * formatos (`default`/`basico`/`minimalista`) a caixa continua igual
 * (sem essa linha). Reaproveita a classe `.station-box__name` da caixa
 * normal (mesmo font/cor/truncamento) em vez de duplicar CSS.
 *
 * **Sem jusante no formato "minimalista"** (2026-09-15, pedido do
 * usuário): esconde as linhas 3/4 inteiras (rótulo "jusante" + valor),
 * não só o valor — um rótulo "jusante" sem nada embaixo não faz sentido.
 * Só nesse formato; `completo`/`default`/`basico` continuam com as 4
 * linhas.
 */
export default function ReservoirStationNode({ data }: NodeProps<ReservoirStationNode>) {
  const {
    stationId,
    name,
    series,
    jusanteSeries,
    classification,
    freshness,
    format,
    selected,
    onSelect,
  } = data;

  const showName = format === "completo";
  const showJusante = format !== "minimalista";
  const cotaValue = series ? `${formatMeters(series.last.value)} m` : "—";
  const jusanteFlow = jusanteSeries?.last.flow ?? null;
  const jusanteValue = jusanteSeries
    ? jusanteFlow != null
      ? `${formatFlow(jusanteFlow)} m³/s`
      : `${formatMeters(jusanteSeries.last.value)} m`
    : "–";
  const title = series ? formatFullDateTimeBR(series.last.at) : undefined;

  const wrapperClass = [
    "reservoir-box-wrapper",
    classification !== "normal" && `reservoir-box-wrapper--${classification}`,
    selected && "reservoir-box-wrapper--selected",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flow-station-node">
      <Handle
        type="target"
        position={Position.Top}
        style={CENTERED_HANDLE_STYLE}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Top}
        style={CENTERED_HANDLE_STYLE}
        isConnectable={false}
      />
      <div
        className={wrapperClass}
        title={name}
        onClick={() => onSelect(stationId)}
        role="button"
        tabIndex={0}
      >
        <div className="reservoir-box" title={title}>
          {showName && (
            <div className="station-box__name" title={name}>
              {name}
            </div>
          )}
          <div className="reservoir-box__label reservoir-box__label--cota">cota</div>
          <div className="reservoir-box__row reservoir-box__row--cota">{cotaValue}</div>
          {showJusante && (
            <>
              <div className="reservoir-box__label reservoir-box__label--jusante">jusante</div>
              <div className="reservoir-box__row reservoir-box__row--jusante">{jusanteValue}</div>
            </>
          )}
        </div>
        {freshness && freshness !== "updated" && (
          <div
            className={`station-box__freshness station-box__freshness--${freshness}`}
            title={FRESHNESS_LABELS[freshness]}
          >
            <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden="true">
              <path d="M10.8 4h2.4l-.5 11h-1.4L10.8 4z" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
