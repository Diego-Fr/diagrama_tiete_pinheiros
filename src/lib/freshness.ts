export type Freshness = "updated" | "waiting" | "delayed";

export const FRESHNESS_LABELS: Record<Freshness, string> = {
  updated: "Atualizado",
  waiting: "Aguardando dado",
  delayed: "Atrasado",
};

/**
 * Situação do dado a partir da data da última medição vs. o `transmission_gap`
 * da estação (minutos):
 *   diff < gap      → "updated"
 *   diff < gap * 2  → "waiting"
 *   senão           → "delayed"
 * `diff` = minutos de agora até a última medição.
 */
export function freshnessOf(
  lastAt: Date,
  gapMinutes: number,
  now: Date = new Date(),
): Freshness {
  const diffMin = (now.getTime() - lastAt.getTime()) / 60_000;
  if (diffMin < gapMinutes) return "updated";
  if (diffMin < gapMinutes * 2) return "waiting";
  return "delayed";
}
