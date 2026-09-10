import { stationsById } from "@/data/stations";
import { useStationStatus } from "@/hooks/useStationStatus";
import { LEVEL_LABELS } from "@/lib/classification";
import { FRESHNESS_LABELS, freshnessOf } from "@/lib/freshness";
import LevelChart from "@/components/LevelChart";

interface StationSidebarProps {
  stationId: number | null;
  onClose: () => void;
  /** Abre o modal com o histórico ampliado. */
  onExpand: () => void;
}

function trendGlyph(prev: number | undefined, last: number): string {
  if (prev == null || last === prev) return "=";
  return last > prev ? "↑" : "↓";
}

/**
 * Painel flutuante à direita, sobre o mapa. Cabeçalho com dados da estação +
 * gráfico do nível montado a partir da série já carregada em `measurements`
 * (sem nova requisição). Fecha no botão ou ao clicar no mapa.
 */
export default function StationSidebar({
  stationId,
  onClose,
  onExpand,
}: StationSidebarProps) {
  const { byId } = useStationStatus();

  if (stationId == null) return null;
  const station = stationsById.get(stationId);
  if (!station) return null;

  const status = byId.get(stationId);
  const series = status?.series ?? null;
  const classification = status?.classification ?? "normal";
  const last = series?.last ?? null;
  const freshness = last
    ? freshnessOf(last.at, station.transmissionGap)
    : null;

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
          <span className="station-sidebar__trend">
            {trendGlyph(series.previous?.value, last.value)}
          </span>
        )}
        <span className="station-sidebar__badge">
          {LEVEL_LABELS[classification]}
        </span>
      </div>
      {last && (
        <p className="station-sidebar__time">
          Última leitura: {last.date}
          {freshness && (
            <span
              className={`station-sidebar__fresh station-sidebar__fresh--${freshness}`}
            >
              {FRESHNESS_LABELS[freshness]}
            </span>
          )}
        </p>
      )}

      <h3 className="station-sidebar__chart-title">Nível — últimas 6&nbsp;h</h3>
      <div className="station-sidebar__chart">
        {series ? (
          <LevelChart
            readings={series.readings}
            thresholds={status?.thresholds ?? {}}
          />
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
