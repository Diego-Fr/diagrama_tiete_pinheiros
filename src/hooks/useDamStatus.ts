import { useQuery } from "@tanstack/react-query";
import { fetchDams } from "@/api/dams";
import { barrages } from "@/data/barrages";

/** Mesmo ritmo de refresh das medições — comportas mudam raramente, mas não
 * custa nada manter consistente com o resto do app. */
export const DAMS_REFRESH_MS = 60 * 1000;

const DAM_API_IDS = barrages.map((b) => b.apiDamId);

/** Situação das comportas das barragens (`/sibh/api/v1/dams`) — sempre "ao
 * vivo", sem o conceito de data de referência (não existe histórico
 * disponível pra isso ainda).
 *
 * `enabled` (2026-09-15, pedido do usuário) — 2 chamadores, 2 motivos pra
 * desligar:
 * - `FlowView` passa `enabled: barrages.length > 0`: `barrages` (de
 *   `data/barrages`) é hoje só do Tietê — a Ribeira de Iguape não tem
 *   nenhuma barragem com telemetria real (suas 8 "barragens" são só ícone
 *   decorativo, ver `FLOW_SIMPLE_BARRAGES`/`ReservoirStationNode`).
 * - `BarrageSidebar` passa `enabled: barrageId != null`: esse componente
 *   fica montado o tempo todo em `App.tsx` (só o `barrageId` decide se
 *   mostra algo), e na Ribeira `barrageId` nunca fica setado (suas
 *   barragens não são clicáveis, `selectable:false`).
 * Sem isso `/v1/dams` era consultada (e reconsultada a cada 60s) MESMO com
 * a Ribeira aberta e nenhuma barragem selecionada, sem nenhum dado sendo
 * de fato usado. */
export function useDamStatus(enabled = true) {
  return useQuery({
    queryKey: ["dams", DAM_API_IDS],
    queryFn: ({ signal }) => fetchDams(DAM_API_IDS, signal),
    refetchInterval: DAMS_REFRESH_MS,
    staleTime: 30 * 1000,
    enabled,
  });
}
