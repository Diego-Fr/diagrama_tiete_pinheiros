import { useQuery } from "@tanstack/react-query";
import { fetchRivers } from "@/api/rivers";
import { RIVER_TYPE_NAMES } from "@/config/rivers";

/** GeoJSON dos rios principais — geometria estática, busca única. */
export function useRivers() {
  return useQuery({
    queryKey: ["rivers", RIVER_TYPE_NAMES],
    queryFn: ({ signal }) => fetchRivers(RIVER_TYPE_NAMES, signal),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
