import { useEffect, useState } from "react";
import type { GroupType } from "@/api/measurements";
import { stationsById } from "@/data/stations";
import { useStationHistory } from "@/hooks/useStationHistory";
import { useStationStatus } from "@/hooks/useStationStatus";
import DateRangeControl from "@/components/DateRangeControl";
import LevelChart from "@/components/LevelChart";
import ReadingsTable from "@/components/ReadingsTable";
import ViewModeToggle, { type ViewMode } from "@/components/ViewModeToggle";

interface StationModalProps {
  stationId: number;
  onClose: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Modal do posto selecionado. Produto principal: histórico do nível — 24 h /
 * agrupamento por minuto por padrão, com seletor de intervalo + agrupamento
 * que dispara nova requisição.
 */
export default function StationModal({ stationId, onClose }: StationModalProps) {
  const [range, setRange] = useState(() => {
    const end = new Date();
    return {
      start: new Date(end.getTime() - DAY_MS),
      end,
      groupType: "minute" as GroupType,
    };
  });

  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const { byId } = useStationStatus();
  const history = useStationHistory(
    stationId,
    range.start.toISOString(),
    range.end.toISOString(),
    range.groupType,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const station = stationsById.get(stationId);
  if (!station) return null;

  const series = history.data?.get(stationId) ?? null;
  const thresholds = byId.get(stationId)?.thresholds ?? {};
  const loading = history.isLoading || history.isFetching;

  return (
    <div
      className="station-modal"
      role="dialog"
      aria-modal="true"
      aria-label={station.name}
      onClick={onClose}
    >
      <div className="station-modal__panel" onClick={(e) => e.stopPropagation()}>
        <header className="station-modal__head">
          <div className="station-modal__title">
            <h2 className="station-modal__name">{station.name}</h2>
            <p className="station-modal__prefix">{station.prefix}</p>
            <p className="station-modal__coords">
              {station.lat.toFixed(5)}, {station.lng.toFixed(5)}
            </p>
          </div>
          <DateRangeControl
            start={range.start}
            end={range.end}
            groupType={range.groupType}
            onApply={(start, end, groupType) =>
              setRange({ start, end, groupType })
            }
          />
          <button
            type="button"
            className="station-modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <div className="station-modal__toolbar">
          <span className="station-modal__toolbar-label">Nível</span>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <div className="station-modal__chart">
          {history.isError ? (
            <p className="level-chart__empty">Falha ao carregar o histórico.</p>
          ) : series ? (
            viewMode === "chart" ? (
              <LevelChart
                readings={series.readings}
                thresholds={thresholds}
                wide
              />
            ) : (
              <ReadingsTable readings={series.readings} />
            )
          ) : !loading ? (
            <p className="level-chart__empty">
              Sem dados no intervalo selecionado.
            </p>
          ) : null}

          {loading && (
            <div className="chart-loading">
              <span className="chart-loading__spinner" aria-hidden="true" />
              <span>Carregando dados…</span>
            </div>
          )}
        </div>

        <footer className="station-modal__foot">
          <span>
            {range.start.toLocaleString("pt-BR")} —{" "}
            {range.end.toLocaleString("pt-BR")}
          </span>
          {series && (
            <span>
              mín {(series.min / 100).toFixed(3)} m · máx{" "}
              {(series.max / 100).toFixed(3)} m · {series.count} leituras
            </span>
          )}
        </footer>
      </div>
    </div>
  );
}
