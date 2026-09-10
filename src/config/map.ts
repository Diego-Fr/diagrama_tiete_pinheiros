import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

/**
 * Visão padrão: estado de São Paulo enquadrado numa tela cheia.
 * Ajustar quando os pontos de monitoramento reais entrarem.
 */
export const DEFAULT_CENTER: LatLngExpression = [-22.4, -48.7];
export const DEFAULT_ZOOM = 7;
export const MIN_ZOOM = 6;
export const MAX_ZOOM = 18;

/** Caixa aproximada do estado de SP, com folga, para limitar o pan. */
export const SP_STATE_BOUNDS: LatLngBoundsExpression = [
  [-25.6, -53.6], // sudoeste
  [-19.5, -43.9], // nordeste
];

export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
