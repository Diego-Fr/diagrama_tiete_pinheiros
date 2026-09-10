import { useQuery } from "@tanstack/react-query";
import { fetchSeriesInRange, type GroupType } from "@/api/measurements";

/**
 * Série de UMA estação numa janela arbitrária (ISO) e agrupamento. Requisição
 * própria — usada pelo modal (24 h / minute por padrão).
 */
export function useStationHistory(
  stationId: number | null,
  startISO: string,
  endISO: string,
  groupType: GroupType,
) {
  return useQuery({
    queryKey: ["history", stationId, startISO, endISO, groupType],
    queryFn: ({ signal }) =>
      fetchSeriesInRange(
        stationId != null ? [stationId] : [],
        startISO,
        endISO,
        groupType,
        signal,
      ),
    enabled: stationId != null,
  });
}
