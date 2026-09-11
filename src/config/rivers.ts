/** Serviço WFS de geodados do DAEE/SIBH. */
export const WFS_BASE = "https://geodados.daee.sp.gov.br/geoserver/sibh/ows";

/**
 * Camadas WFS a buscar (nome da feature type, sem o prefixo `sibh:`). Cada
 * camada pode trazer várias features/rios — o sentido da vazão é resolvido
 * por rio (ver `RIVER_FLOW_DIRECTIONS`), não por camada.
 */
export const RIVER_TYPE_NAMES = ["tiete_pinheiros"];

export type FlowDirection = "up" | "down" | "left" | "right";

/**
 * Sentido da vazão por rio, casado por substring (case-insensitive) no
 * `NomeTrecho` da feature. Comparado com a orientação real da geometria de
 * cada trecho (RiversLayer) para decidir se a animação roda a favor ou contra
 * a ordem dos vértices do GeoJSON.
 */
export const RIVER_FLOW_DIRECTIONS: { match: RegExp; direction: FlowDirection }[] =
  [
    { match: /pinheiros/i, direction: "up" },
    { match: /tiet/i, direction: "right" },
  ];
