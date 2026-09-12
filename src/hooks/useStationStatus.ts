import { useMemo } from "react";
import type { StationSeries } from "@/api/measurements";
import type { ReferenceThresholds } from "@/api/parameters";
import { classifyLevel, type LevelClass } from "@/lib/classification";
import { freshnessOf, type Freshness } from "@/lib/freshness";
import { fluviometricStations, fluviometricIds } from "@/data/stations";
import { useMeasurements } from "@/hooks/useMeasurements";
import { useParameters } from "@/hooks/useParameters";

export interface StationStatus {
  stationId: number;
  /** Classificação do nível da última medição contra os limiares. */
  classification: LevelClass;
  thresholds: ReferenceThresholds;
  series: StationSeries | null;
  /** Situação do dado (atualizado/aguardando/atrasado) vs. `measurement_gap`;
   * null quando não há nenhuma leitura para julgar. */
  freshness: Freshness | null;
}

/**
 * Estado atual de cada estação fluviométrica: série de medições + classificação
 * do nível. Fonte única — a cor da caixa no mapa e usos futuros (listas,
 * filtros, resumos) devem consumir daqui.
 *
 * `referenceDate` = null → "agora" (ao vivo); uma data fixa congela a janela
 * de 6h nesse instante (ver `useMeasurements`).
 */
export function useStationStatus(referenceDate: Date | null = null) {
  const measurements = useMeasurements(fluviometricIds, referenceDate);
  const parameters = useParameters(fluviometricIds);

  const byId = useMemo(() => {
    // "Agora" para fins de atraso: o instante sendo observado — real, em modo
    // ao vivo, ou a própria data de referência, ao navegar por um passado.
    const now = referenceDate ?? new Date();
    const map = new Map<number, StationStatus>();
    for (const s of fluviometricStations) {
      const series = measurements.data?.get(s.id) ?? null;
      const thresholds = parameters.data?.get(s.id) ?? {};
      const classification =
        series != null ? classifyLevel(series.last.value, thresholds) : "normal";
      const freshness =
        series != null ? freshnessOf(series.last.at, s.measurementGap, now) : null;
      map.set(s.id, { stationId: s.id, classification, thresholds, series, freshness });
    }
    return map;
  }, [measurements.data, parameters.data, referenceDate]);

  return {
    byId,
    isLoading: measurements.isLoading || parameters.isLoading,
    isError: measurements.isError || parameters.isError,
  };
}
