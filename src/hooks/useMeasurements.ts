import { useQuery } from "@tanstack/react-query";
import { fetchStationSeries } from "@/api/measurements";

/** Intervalo de auto-refresh das medições (a barra de progresso reflete isto). */
export const MEASUREMENTS_REFRESH_MS = 60 * 1000;

/**
 * Série agregada de cada estação (mapa id → {last, previous, min, max}), na
 * janela de 6h terminando em `referenceDate`.
 *
 * `referenceDate === null` → modo "agora": usa o instante real a cada busca e
 * recarrega sozinho a cada `MEASUREMENTS_REFRESH_MS`. Com uma data fixa, a
 * janela fica parada no passado — busca uma vez só, sem polling.
 *
 * `stationIds` deve ser uma referência estável (ver `fluviometricIds`).
 */
export function useMeasurements(
  stationIds: number[],
  referenceDate: Date | null,
) {
  const isLive = referenceDate == null;
  return useQuery({
    queryKey: [
      "measurements",
      stationIds,
      isLive ? "live" : referenceDate.getTime(),
    ],
    queryFn: ({ signal }) =>
      fetchStationSeries(stationIds, referenceDate ?? new Date(), signal),
    refetchInterval: isLive ? MEASUREMENTS_REFRESH_MS : false,
    staleTime: isLive ? 30 * 1000 : Infinity,
  });
}
