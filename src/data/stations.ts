import rawStationsTiete from "./stations.raw.json";
import rawStationsRibeira from "./stations_ribeira.raw.json";
import type { RawStation, Region, StationKind, StationPoint } from "@/types/station";

const NULLISH = new Set(["", "NULL", "null", "undefined"]);

function isUsableText(v: unknown): v is string {
  return typeof v === "string" && !NULLISH.has(v.trim()) && v.trim().length > 0;
}

/**
 * Escolhe o texto do prefixo. Alguns registros vêm com `prefix` corrompido
 * (strings tipo "3E-193" viraram o float 3e-193 ao serem coladas sem aspas);
 * nesses casos caímos para `alt_prefix` e, por fim, para o station_id.
 */
function toDisplayPrefix(raw: RawStation): string {
  const { prefix, alt_prefix: alt, station_id } = raw;

  if (isUsableText(prefix)) return prefix.trim();
  if (typeof prefix === "number" && Number.isFinite(prefix) && prefix >= 1) {
    return String(prefix);
  }
  if (isUsableText(alt)) return alt.trim();
  if (typeof alt === "number" && Number.isFinite(alt) && alt >= 1) {
    return String(alt);
  }
  return `#${station_id}`;
}

function toKind(typeId: number): StationKind {
  if (typeId === 1) return "nivel";
  if (typeId === 2) return "chuva";
  return "outro";
}

/** Gap de medição em minutos (base do indicador de atraso); cai para
 * transmission_gap e por fim 10 quando ausente/inválido. */
function toMeasurementGap(raw: RawStation): number {
  const m = Number(raw.measurement_gap);
  if (Number.isFinite(m) && m > 0) return m;
  const t = Number(raw.transmission_gap);
  if (Number.isFinite(t) && t > 0) return t;
  return 10;
}

/** Cada bacia tem seu próprio JSON cru — mesclados aqui, cada posto marcado
 * com a `region` de origem (2026-09-14, feature de múltiplas áreas de
 * interesse). Os ids são únicos entre as duas fontes (conferido: 0
 * colisões) — um `Map` único por id (`stationsById`) continua seguro. */
const RAW_BY_REGION: Record<Region, RawStation[]> = {
  tiete: rawStationsTiete as unknown as RawStation[],
  ribeira: rawStationsRibeira as unknown as RawStation[],
};

function toStationPoints(raw: RawStation[], region: Region): StationPoint[] {
  return raw
    .filter(
      (r) =>
        Number.isFinite(r.latitude) &&
        Number.isFinite(r.longitude) &&
        r.latitude !== 0 &&
        r.longitude !== 0,
    )
    .map((r) => ({
      id: r.id,
      stationId: r.station_id,
      name: r.name,
      lat: r.latitude,
      lng: r.longitude,
      prefix: toDisplayPrefix(r),
      kind: toKind(r.station_type_id),
      measurementGap: toMeasurementGap(r),
      region,
      raw: r,
    }));
}

/** Todos os postos de todas as bacias, mesclados — só para lookup global por
 * id (`stationsById`), que é seguro entre regiões (ids não colidem). Telas
 * que listam "todos os postos" (mapa, diagrama, refresh bar) NÃO devem usar
 * isso direto — usar `REGION_STATIONS[region]`/`REGION_FLUVIOMETRIC_IDS[region]`. */
export const stations: StationPoint[] = (
  Object.keys(RAW_BY_REGION) as Region[]
).flatMap((region) => toStationPoints(RAW_BY_REGION[region], region));

export const stationsById = new Map(stations.map((s) => [s.id, s]));

/** Estações fluviométricas (station_type_id === 1) de cada bacia — as
 * únicas exibidas no mapa/diagrama por ora. Arrays estáveis (computados uma
 * vez no load do módulo) — seguros como dependência de `useMemo`/queryKey. */
export const REGION_STATIONS: Record<Region, StationPoint[]> = {
  tiete: stations.filter((s) => s.region === "tiete" && s.kind === "nivel"),
  ribeira: stations.filter((s) => s.region === "ribeira" && s.kind === "nivel"),
};

/** Ids das fluviométricas de cada bacia; referência estável para usar como
 * queryKey (`useMeasurements`/`useParameters`). */
export const REGION_STATION_IDS: Record<Region, number[]> = {
  tiete: REGION_STATIONS.tiete.map((s) => s.id),
  ribeira: REGION_STATIONS.ribeira.map((s) => s.id),
};
