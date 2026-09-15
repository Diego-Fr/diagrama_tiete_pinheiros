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
  /** Subtipo específico de diagrama — hoje só usado pelas UHEs do Rio
   * Juquiá-Guaçu (2026-09-15, Ribeira de Iguape): `"reservatorio"` marca
   * um posto que monitora o NÍVEL DO RESERVATÓRIO de uma barragem (não o
   * curso normal de um rio) — muda como a caixa é desenhada no diagrama
   * (`ReservoirStationNode.tsx`, 3 linhas empilhadas montante/
   * reservatório/jusante, só o meio com dado real por ora). Ausente/
   * `undefined` = posto comum (a grande maioria). */
  station_subtype?: "reservatorio";
  /** Id do posto que mede o nível de JUSANTE dessa UHE (2026-09-15,
   * Ribeira de Iguape) — só existe nos 5 dos 8 registros
   * `station_subtype: "reservatorio"` que têm jusante monitorada (as
   * outras 3 UHEs não têm posto de jusante ainda). Vem de
   * `data/station_aux.raw.txt` (id/prefix/nome de postos auxiliares que
   * não entram no mapa/diagrama como posto próprio — só servem pra
   * telemetria extra de outro posto), relacionado por NOME (ex.:
   * "Juquitiba (UHE França Jusante)" → jusante de "Juquitiba (UHE França
   * Barramento)"). Usado por `ReservoirStationNode`/`FlowView` pra buscar
   * o dado extra e mostrar na 4ª linha da caixa. */
  jusante_prefix_id?: number;
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
  /** Ver `RawStation.station_subtype` — copiado pra cá só pra não ter que
   * cavar `.raw` toda vez que um componente precisa checar isso. */
  subtype?: "reservatorio";
  /** Ver `RawStation.jusante_prefix_id` — copiado pra cá pelo mesmo motivo. */
  jusanteStationId?: number;
  raw: RawStation;
}
