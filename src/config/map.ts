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

/**
 * Base layer cinza claro estilo "Positron" — usando o Esri World Light Gray
 * Canvas, que é gratuito e SEM API key (o CARTO Positron passou a exigir key).
 * Tiles Esri usam ordem {z}/{y}/{x}. Só vai até z16 nativo → `maxNativeZoom`.
 */
export const BASEMAP_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
/** Camada de rótulos (nomes de lugares/vias), sobreposta à base cinza. */
export const BASEMAP_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
export const BASEMAP_MAX_NATIVE_ZOOM = 16;

/** Camada de satélite (Esri World Imagery — gratuita, sem API key). */
export const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
/** Rótulos claros com halo, feitos para sobrepor imagem de satélite. */
export const SATELLITE_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

/** Miniatura (tile real cobrindo a RMSP) para o seletor de camadas. */
export const BASEMAP_THUMB_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/10/580/379";
export const SATELLITE_THUMB_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/580/379";
