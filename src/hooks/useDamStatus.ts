import { useQuery } from "@tanstack/react-query";
import { fetchDams } from "@/api/dams";
import { barrages } from "@/data/barrages";

/** Mesmo ritmo de refresh das medições — comportas mudam raramente, mas não
 * custa nada manter consistente com o resto do app. */
export const DAMS_REFRESH_MS = 60 * 1000;

const DAM_API_IDS = barrages.map((b) => b.apiDamId);

/** Situação das comportas das barragens (`/sibh/api/v1/dams`) — sempre "ao
 * vivo", sem o conceito de data de referência (não existe histórico
 * disponível pra isso ainda). */
export function useDamStatus() {
  return useQuery({
    queryKey: ["dams", DAM_API_IDS],
    queryFn: ({ signal }) => fetchDams(DAM_API_IDS, signal),
    refetchInterval: DAMS_REFRESH_MS,
    staleTime: 30 * 1000,
  });
}
