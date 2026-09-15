import type { StationSeries } from "@/api/measurements";
import type { Trend } from "@/lib/trendIcons";

/** Valor da API vem em centímetros; as caixas exibem metros com 3 casas. */
export function formatMeters(centimeters: number): string {
  return (centimeters / 100).toFixed(3);
}

/** Vazão (m³/s) — `Reading.flow`, já vem pronto da API (sem conversão de
 * unidade, ao contrário do nível). Só usado nas estações de JUSANTE de
 * reservatório (2026-09-15) — ver `ReservoirStationNode`/`StationSidebar`/
 * `StationModal`. */
export function formatFlow(m3s: number): string {
  return m3s.toFixed(2);
}

/** Bundle pronto pro `LevelChart` plotar a 2ª linha (eixo próprio) — o
 * componente de gráfico não sabe nada de `StationSeries`/`flow`, só
 * plota o que vier aqui já resolvido. Nome ficou de quando isso só
 * existia pra jusante de reservatório; hoje (2026-09-15) serve tanto pra
 * jusante quanto pra vazão de QUALQUER posto (`buildFlowChartSeries`
 * abaixo) — mesma forma, dois construtores diferentes. */
export interface JusanteChartSeries {
  /** "Jusante" (nível, `Reading.value`, só no caso específico de
   * jusante de reservatório sem vazão) ou "Vazão" (`Reading.flow`). */
  label: string;
  /** "m" ou "m³/s" — só pro tooltip (os ticks do eixo não mostram
   * unidade, igual o eixo da cota). */
  unit: string;
  points: { x: number; y: number }[];
}

/** Pontos de VAZÃO de uma série (`Reading.flow`, de `read_value` na API) —
 * só as leituras que têm o campo preenchido. */
function flowPoints(series: StationSeries): { x: number; y: number }[] {
  return series.readings
    .filter((r) => r.flow != null)
    .map((r) => ({ x: r.at.getTime(), y: r.flow! }));
}

/** Vazão como 2ª linha do gráfico, pra QUALQUER posto fluviométrico
 * (2026-09-15, pedido do usuário: "qualquer posto flu, com read_value tem
 * vazao... no click da caixa e no modal, exibir a vazao em eixo
 * contrario") — usa a MESMA série do posto selecionado (não uma auxiliar
 * como a jusante). Diferente de `buildJusanteChartSeries`, NÃO cai pra
 * nível quando não há vazão (plotar o nível de novo, numa 2ª linha, seria
 * só duplicar a 1ª linha do gráfico) — sem `flow` em nenhuma leitura,
 * `undefined` (sem 2ª linha, como sempre foi pra posto comum). */
export function buildFlowChartSeries(
  series: StationSeries | null,
): JusanteChartSeries | undefined {
  if (!series) return undefined;
  const points = flowPoints(series);
  if (points.length === 0) return undefined;
  return { label: "Vazão", unit: "m³/s", points };
}

/** Monta o bundle acima a partir da série crua de um posto de JUSANTE de
 * reservatório — usado por `StationSidebar`/`StationModal` (mesma regra
 * nos dois: prefere vazão quando há `flow`, senão cai pro nível — esse
 * fallback é específico daqui, porque a jusante é uma estação diferente
 * da que está selecionada, então mostrar o nível dela ainda agrega
 * informação nova, ao contrário do caso genérico acima). `null`/sem
 * leituras → `undefined` (sem 2ª linha no gráfico). */
export function buildJusanteChartSeries(
  series: StationSeries | null,
): JusanteChartSeries | undefined {
  if (!series || series.readings.length === 0) return undefined;
  const flow = buildFlowChartSeries(series);
  if (flow) return flow;
  return {
    label: "Jusante",
    unit: "m",
    points: series.readings.map((r) => ({ x: r.at.getTime(), y: r.value / 100 })),
  };
}

/** Tendência simples: penúltima leitura vs. última. Usado por toda caixa de
 * posto — mapa (`StationsLayer`) e diagrama de fluxo (`StationFlowNode`). */
export function trendOf(series: StationSeries): Trend {
  const previous = series.previous?.value;
  if (previous == null || series.last.value === previous) return "flat";
  return series.last.value > previous ? "up" : "down";
}
