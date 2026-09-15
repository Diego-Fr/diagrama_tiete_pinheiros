/** Objeto cru vindo de `stations.raw.json` (schema do backend de postos). */
export interface RawStation {
  name: string;
  latitude: number;
  longitude: number;
  /** Identificador único do registro de posto. */
  id: number;
  /** Identificador da estação física (pode repetir entre registros). */
  station_id: number;
  prefix: string | number;
  alt_prefix: string | number;
  /** 1 = fluviométrica (nível), 2 = pluviométrica (chuva) — inferido. */
  station_type_id: number;
  /** Intervalo esperado de transmissão, em minutos. */
  transmission_gap: number;
  /** Intervalo esperado de medição, em minutos. */
  measurement_gap: number;
  [key: string]: unknown;
}

export type StationKind = "nivel" | "chuva" | "outro";

/**
 * Área de interesse / bacia — cada uma tem seu próprio dataset de postos
 * (`stations.raw.json`/`stations_ribeira.raw.json`) e seu próprio diagrama
 * curado (`config/flowDiagram.ts`/`config/flowDiagramRibeira.ts`). Ver
 * `config/diagrams.ts` (seletor no título) e `data/stations.ts` (merge +
 * filtro por região). IDs de posto são únicos entre as duas bacias (sem
 * colisão, conferido em 2026-09-14), então um lookup global por id
 * (`stationsById`) continua seguro — só as listas/telas que mostram "todos
 * os postos" (mapa, diagrama, refresh bar) precisam ser filtradas por
 * região.
 */
export type Region = "tiete" | "ribeira";

/** Forma normalizada usada pela UI. */
export interface StationPoint {
  id: number;
  stationId: number;
  name: string;
  lat: number;
  lng: number;
  /** Texto exibido no topo da caixa. */
  prefix: string;
  kind: StationKind;
  /** Intervalo de medição esperado (min) — base do indicador de atraso. */
  measurementGap: number;
  /** Bacia/área de interesse a que esse posto pertence. */
  region: Region;
  raw: RawStation;
}
