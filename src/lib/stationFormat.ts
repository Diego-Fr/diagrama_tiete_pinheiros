import type { StationSeries } from "@/api/measurements";
import type { Trend } from "@/lib/trendIcons";

/** Valor da API vem em centímetros; as caixas exibem metros com 3 casas. */
export function formatMeters(centimeters: number): string {
  return (centimeters / 100).toFixed(3);
}

/** Tendência simples: penúltima leitura vs. última. Usado por toda caixa de
 * posto — mapa (`StationsLayer`) e diagrama de fluxo (`StationFlowNode`). */
export function trendOf(series: StationSeries): Trend {
  const previous = series.previous?.value;
  if (previous == null || series.last.value === previous) return "flat";
  return series.last.value > previous ? "up" : "down";
}
