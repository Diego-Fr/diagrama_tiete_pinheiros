import type { ReferenceThresholds } from "@/api/parameters";

/** Classificação do nível atual da estação, da mais branda para a mais grave. */
export type LevelClass =
  | "normal"
  | "attention"
  | "alert"
  | "emergency"
  | "extravasation";

/** Gravidade crescente — útil para comparação/ordenação em outras telas. */
export const LEVEL_ORDER: readonly LevelClass[] = [
  "normal",
  "attention",
  "alert",
  "emergency",
  "extravasation",
];

/** Rótulos em português para exibição. */
export const LEVEL_LABELS: Record<LevelClass, string> = {
  normal: "Normal",
  attention: "Atenção",
  alert: "Alerta",
  emergency: "Emergência",
  extravasation: "Extravasamento",
};

/**
 * Classifica um valor de nível (cm) contra os valores de referência (cm).
 * Cada patamar sem limiar definido é ignorado. `>=` conta como atingido.
 */
export function classifyLevel(
  valueCm: number,
  thresholds: ReferenceThresholds,
): LevelClass {
  const { attention, alert, emergency, extravasation } = thresholds;
  if (extravasation != null && valueCm >= extravasation) return "extravasation";
  if (emergency != null && valueCm >= emergency) return "emergency";
  if (alert != null && valueCm >= alert) return "alert";
  if (attention != null && valueCm >= attention) return "attention";
  return "normal";
}
