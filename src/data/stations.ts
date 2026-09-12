import rawStations from "./stations.raw.json";
import type { RawStation, StationKind, StationPoint } from "@/types/station";

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

export const stations: StationPoint[] = (rawStations as unknown as RawStation[])
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
    raw: r,
  }));

export const stationsById = new Map(stations.map((s) => [s.id, s]));

/** Estações fluviométricas (station_type_id === 1) — as únicas no mapa por ora. */
export const fluviometricStations = stations.filter((s) => s.kind === "nivel");

/** Ids das fluviométricas; referência estável para usar como queryKey. */
export const fluviometricIds = fluviometricStations.map((s) => s.id);
