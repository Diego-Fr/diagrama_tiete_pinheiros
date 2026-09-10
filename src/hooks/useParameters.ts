import { useQuery } from "@tanstack/react-query";
import { fetchReferenceThresholds } from "@/api/parameters";

/**
 * Limiares de nível por estação. Mudam muito raramente → cache longo.
 * `stationIds` deve ser uma referência estável (ver `fluviometricIds`).
 */
export function useParameters(stationIds: number[]) {
  return useQuery({
    queryKey: ["parameters", stationIds],
    queryFn: ({ signal }) => fetchReferenceThresholds(stationIds, signal),
    staleTime: 60 * 60 * 1000,
  });
}
