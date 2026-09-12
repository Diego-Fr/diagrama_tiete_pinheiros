/** Tendência entre a leitura anterior e a mais recente. */
export type Trend = "up" | "down" | "flat";

/**
 * Desenho (viewBox 0 0 24 24) da seta de tendência — usado tanto nas caixas
 * do mapa (`StationsLayer`, como string HTML pro DivIcon) quanto em React
 * puro (`TrendArrow`, usado na sidebar/modal/tabela) pra manter o mesmo
 * ícone em todo canto. Setas SVG em vez de glifo de fonte (↑/↓) — o glifo
 * não fica centralizado no próprio em-box e fica minúsculo em fontes
 * pequenas.
 */
export const TREND_PATHS: Record<Trend, string> = {
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  flat: "M6 10h12M6 14h12",
};
