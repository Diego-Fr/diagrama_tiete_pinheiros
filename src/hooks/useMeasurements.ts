import { useQuery } from "@tanstack/react-query";
import { fetchStationSeries } from "@/api/measurements";

/** Intervalo de auto-refresh das medições (a barra de progresso reflete isto). */
export const MEASUREMENTS_REFRESH_MS = 60 * 1000;

/**
 * Série agregada de cada estação (mapa id → {last, previous, min, max}).
 * `stationIds` deve ser uma referência estável (ver `fluviometricIds`).
 */
export function useMeasurements(stationIds: number[]) {
  return useQuery({
    queryKey: ["measurements", stationIds],
    queryFn: ({ signal }) => fetchStationSeries(stationIds, signal),
    refetchInterval: MEASUREMENTS_REFRESH_MS,
    staleTime: 30 * 1000,
  });
}
