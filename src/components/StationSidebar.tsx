import { useState } from "react";
import { stationsById } from "@/data/stations";
import { useStationStatus } from "@/hooks/useStationStatus";
import { LEVEL_LABELS } from "@/lib/classification";
import { formatDateTimeBR, formatFullDateTimeBR } from "@/lib/datetime";
import { FRESHNESS_LABELS } from "@/lib/freshness";
import type { Trend } from "@/lib/trendIcons";
import LevelChart from "@/components/LevelChart";
import ReadingsTable from "@/components/ReadingsTable";
import TrendArrow from "@/components/TrendArrow";
import ViewModeToggle, { type ViewMode } from "@/components/ViewModeToggle";

interface StationSidebarProps {
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
  stationId,
  referenceDate,
  onClose,
  onExpand,
}: StationSidebarProps) {
  const { byId } = useStationStatus(referenceDate);
  const [viewMode, setViewMode] = useState<ViewMode>("chart");

  if (stationId == null) return null;
  const station = stationsById.get(stationId);
  if (!station) return null;

  const status = byId.get(stationId);
  const series = status?.series ?? null;
  const classification = status?.classification ?? "normal";
  const last = series?.last ?? null;
  const freshness = status?.freshness ?? null;

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
          <span>{station.prefix}</span>
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
