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
  /** Intervalo de transmissão esperado (min) — base do indicador de atraso. */
  transmissionGap: number;
  raw: RawStation;
}
