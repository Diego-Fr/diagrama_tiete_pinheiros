import { useState } from "react";
import { REGION_JUSANTE_IDS, stationsById } from "@/data/stations";
import type { Region, StationPoint } from "@/types/station";
import { useMeasurements } from "@/hooks/useMeasurements";
import { useStationStatus } from "@/hooks/useStationStatus";
import { LEVEL_LABELS } from "@/lib/classification";
import { formatDateTimeBR, formatFullDateTimeBR } from "@/lib/datetime";
import { FRESHNESS_LABELS } from "@/lib/freshness";
import { buildFlowChartSeries, buildJusanteChartSeries, formatFlow } from "@/lib/stationFormat";
import type { Trend } from "@/lib/trendIcons";
import LevelChart from "@/components/LevelChart";
import ReadingsTable from "@/components/ReadingsTable";
import TrendArrow from "@/components/TrendArrow";
import ViewModeToggle, { type ViewMode } from "@/components/ViewModeToggle";

interface StationSidebarProps {
  /** Postos da área de interesse ativa (`REGION_STATIONS[region]`) — MESMA
   * lista (mesma referência estável) que `MapView`/`FlowView` já usam, de
   * propósito: `useStationStatus` monta a queryKey a partir disso, então
   * passar a lista da região inteira (em vez de só este posto) reaproveita
   * o cache que o mapa/diagrama já preencheram, sem nova requisição
   * (bug real corrigido em 2026-09-15 — uma "otimização" anterior que
   * passava só `[station]` parecia mais econômica, mas na prática tinha o
   * efeito OPOSTO: criava uma queryKey diferente da já usada pelo
   * mapa/diagrama, então toda abertura de sidebar disparava uma request
   * nova pra medições E parâmetros, mesmo já tendo os dados). */
  /** Bacia ativa — só usada pra buscar `REGION_JUSANTE_IDS[region]` (série
   * de jusante das UHEs de reservatório, 2026-09-15). */
  region: Region;
  stations: StationPoint[];
  stationIds: number[];
  stationId: number | null;
  /** null = agora (ao vivo); data fixa = janela de 6h congelada nela. */
  referenceDate: Date | null;
  onClose: () => void;
  /** Abre o modal com o histórico ampliado. */
  onExpand: () => void;
}

function trendOf(prev: number | undefined, last: number): Trend {
  if (prev == null || last === prev) return "flat";
  return last > prev ? "up" : "down";
}

/**
 * Painel flutuante à direita, sobre o mapa. Cabeçalho com dados da estação +
 * gráfico do nível montado a partir da série já carregada em `measurements`
 * (sem nova requisição). Fecha no botão ou ao clicar no mapa.
 */
export default function StationSidebar({
  region,
  stations,
  stationIds,
  stationId,
  referenceDate,
  onClose,
  onExpand,
}: StationSidebarProps) {
  // `stations`/`stationIds` são a lista da REGIÃO INTEIRA (mesma referência
  // que MapView/FlowView usam) — reaproveita o cache já buscado, não
  // dispara request nova (ver comentário na prop, acima).
  const { byId } = useStationStatus(stations, stationIds, referenceDate);
  // Série de JUSANTE (2026-09-15) — mesmo `REGION_JUSANTE_IDS[region]`
  // (referência estável) que `FlowView` já usa; se o diagrama já buscou
  // isso (mesma janela/`referenceDate`), bate a MESMA queryKey do React
  // Query e não dispara request nova.
  const { data: jusanteData } = useMeasurements(REGION_JUSANTE_IDS[region], referenceDate);
  const [viewMode, setViewMode] = useState<ViewMode>("chart");

  if (stationId == null) return null;
  // Lookup é global (id é único entre bacias, ver `data/stations.ts`).
  const station = stationsById.get(stationId);
  if (!station) return null;

  const status = byId.get(stationId);
  const series = status?.series ?? null;
  const classification = status?.classification ?? "normal";
  const last = series?.last ?? null;
  const freshness = status?.freshness ?? null;
  const jusanteSeries =
    station.jusanteStationId != null
      ? (jusanteData?.get(station.jusanteStationId) ?? null)
      : null;
  // 2ª linha do gráfico (2026-09-15) — prefere a jusante da UHE quando
  // existe (`jusanteSeries`, série auxiliar de OUTRO posto); senão, cai
  // pra vazão do PRÓPRIO posto selecionado, se a API preencheu
  // `read_value` nele (pedido do usuário: "qualquer posto flu, com
  // read_value tem vazao... no click da caixa e no modal, exibir a vazao
  // em eixo contrario" — generaliza o que antes só valia pra jusante).
  const secondaryChart = buildJusanteChartSeries(jusanteSeries) ?? buildFlowChartSeries(series);
  // Linha "Vazão: X m³/s" no cabeçalho — mesma prioridade acima (jusante
  // primeiro, senão a vazão do próprio posto).
  const flowValue = jusanteSeries?.last.flow ?? series?.last.flow ?? null;
  // Prefixo da API (correto) quando disponível; só cai pro estático
  // (`station.prefix`, que tem registros corrompidos — ver `stations.ts`)
  // se a janela consultada não trouxe nenhuma leitura ainda.
  const prefix = series?.prefix ?? station.prefix;

  const chartTitle = referenceDate
    ? `Nível — 6 h até ${formatDateTimeBR(referenceDate)}`
    : "Nível — últimas 6 h";

  return (
    <aside
      className={`station-sidebar station-sidebar--${classification}`}
      role="dialog"
      aria-label={station.name}
    >
      <button
        type="button"
        className="station-sidebar__close"
        onClick={onClose}
        aria-label="Fechar"
      >
        ×
      </button>

      <header className="station-sidebar__head">
        <h2 className="station-sidebar__name">{station.name}</h2>
        <p className="station-sidebar__meta">
          <span>{prefix}</span>
          <span>
            {station.lat.toFixed(5)}, {station.lng.toFixed(5)}
          </span>
        </p>
      </header>

      <div className="station-sidebar__status">
        <span className="station-sidebar__value">
          {last ? (last.value / 100).toFixed(3) : "—"}
          <small>m</small>
        </span>
        {last && series && (
          <span
            className={`station-sidebar__trend station-sidebar__trend--${trendOf(
              series.previous?.value,
              last.value,
            )}`}
          >
            <TrendArrow trend={trendOf(series.previous?.value, last.value)} size={22} />
          </span>
        )}
        <span className="station-sidebar__badge">
          {LEVEL_LABELS[classification]}
        </span>
      </div>
      {last && (
        <p className="station-sidebar__time">
          Última leitura: {formatFullDateTimeBR(last.at)}
          {freshness && (
            <span
              className={`station-sidebar__fresh station-sidebar__fresh--${freshness}`}
            >
              {FRESHNESS_LABELS[freshness]}
            </span>
          )}
        </p>
      )}
      {/* Vazão (2026-09-15) — jusante da UHE ou do próprio posto, só
          quando a API preenche `read_value` (`Reading.flow`). */}
      {flowValue != null && (
        <p className="station-sidebar__time">Vazão: {formatFlow(flowValue)} m³/s</p>
      )}

      <div className="station-sidebar__chart-head">
        <h3 className="station-sidebar__chart-title">{chartTitle}</h3>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
      </div>
      <div className="station-sidebar__chart">
        {series ? (
          viewMode === "chart" ? (
            <LevelChart
              readings={series.readings}
              thresholds={status?.thresholds ?? {}}
              secondary={secondaryChart}
            />
          ) : (
            <ReadingsTable readings={series.readings} />
          )
        ) : (
          <p className="level-chart__empty">Sem dados para esta estação.</p>
        )}
      </div>

      {series && (
        <p className="station-sidebar__range">
          mín {(series.min / 100).toFixed(3)} m · máx{" "}
          {(series.max / 100).toFixed(3)} m · {series.count} leituras
        </p>
      )}

      <button
        type="button"
        className="station-sidebar__more"
        onClick={onExpand}
      >
        Ver mais
      </button>
    </aside>
  );
}
