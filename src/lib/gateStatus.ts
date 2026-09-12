/**
 * Situação de uma comporta de barragem — agora vem de verdade da API
 * (`/sibh/api/v1/dams`, ver `src/api/dams.ts`/`useDamStatus`). Convenção de
 * cor: verde = aberta, vermelho = fechada. Enquanto o dado real não chegou
 * (carregando/erro/sem evento pra aquela comporta), a premissa é que está
 * ABERTA (pedido do usuário, 2026-09-12) — não "sem dado".
 */
export type GateStatus = "aberta" | "fechada";

export const GATE_STATUS_LABELS: Record<GateStatus, string> = {
  aberta: "Aberta",
  fechada: "Fechada",
};

export const GATE_STATUS_COLORS: Record<GateStatus, string> = {
  aberta: "#16a34a",
  fechada: "#dc2626",
};

/** Sem dado real ainda pra essa comporta — assume aberta. */
export const DEFAULT_GATE_STATUS: GateStatus = "aberta";

export function gateStatusOf(open: boolean): GateStatus {
  return open ? "aberta" : "fechada";
}

/** "3" → "Comporta 3"; "F-1"/"F-2" (comportas de fundo da Barragem Móvel)
 * → "Comporta de Fundo 1"/"2". */
export function gateLabel(gateId: string): string {
  const fundo = /^F-?(\d+)$/i.exec(gateId);
  if (fundo) return `Comporta de Fundo ${fundo[1]}`;
  return `Comporta ${gateId}`;
}
