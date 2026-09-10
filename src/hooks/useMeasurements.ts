import { useQuery } from "@tanstack/react-query";
import { fetchStationSeries } from "@/api/measurements";

/** Recarrega no ritmo aproximado de transmissão das estações. */
const REFETCH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Série agregada de cada estação (mapa id → {last, previous, min, max}).
 * `stationIds` deve ser uma referência estável (ver `fluviometricIds`).
 */
export function useMeasurements(stationIds: number[]) {
  return useQuery({
    queryKey: ["measurements", stationIds],
    queryFn: ({ signal }) => fetchStationSeries(stationIds, signal),
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: 60 * 1000,
  });
}
