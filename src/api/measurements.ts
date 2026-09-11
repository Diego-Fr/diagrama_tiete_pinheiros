import { API_BASE } from "@/api/base";
import { parseApiUtcDate } from "@/lib/datetime";

/** Registro cru de `/sibh/api/v2/measurements`. */
export interface RawMeasurement {
  /** Bate com `StationPoint.id` (apesar do nome "prefix_id"). */
  station_prefix_id: string;
  prefix: string;
  station_name: string;
  station_type_id: string;
  value: number | null;
  read_value: number | null;
  measurement_id: string;
  /** "YYYY/MM/DD HH:mm" — em UTC (ver `parseApiUtcDate`). */
  date: string;
}

interface MeasurementsResponse {
  measurements: RawMeasurement[];
}

/** Agrupamento aceito pela API (`group_type`). */
export type GroupType = "minute" | "hour" | "day" | "month";

export interface Reading {
  value: number;
  /** String original da API ("YYYY/MM/DD HH:mm"). */
  date: string;
  /** `date` parseado, para comparação/ordenação. */
  at: Date;
}

/** Série de uma estação na janela consultada, já agregada para a UI. */
export interface StationSeries {
  stationId: number;
  /** Todas as leituras da janela, ordenadas por data crescente (para o gráfico). */
  readings: Reading[];
  /** Leitura mais recente. */
  last: Reading;
  /** Leitura imediatamente anterior (base da tendência). */
  previous: Reading | null;
  /** Menor valor da série. */
  min: number;
  /** Maior valor da série. */
  max: number;
  count: number;
}

const BASE_URL = `${API_BASE}/v2/measurements`;

/** Janela de busca: quanto olhamos para trás procurando a última leitura. */
const LOOKBACK_MS = 6 * 60 * 60 * 1000;

/** A API devolve vazio silenciosamente acima disso por requisição. */
const MAX_IDS_PER_REQUEST = 10;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function fetchBatch(
  stationIds: number[],
  startDate: string,
  endDate: string,
  groupType: GroupType,
  signal?: AbortSignal,
): Promise<RawMeasurement[]> {
  const params = new URLSearchParams();
  for (const id of stationIds) {
    params.append("station_prefix_ids[]", String(id));
  }
  params.set("start_date", startDate);
  params.set("end_date", endDate);
  params.set("group_type", groupType);

  const res = await fetch(`${BASE_URL}?${params.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`measurements: HTTP ${res.status}`);
  }
  const body = (await res.json()) as MeasurementsResponse;
  return body.measurements ?? [];
}

/**
 * Busca medições das estações numa janela [startDate, endDate] (ISO) e devolve,
 * por estação, a série agregada: leituras ordenadas, última, penúltima
 * (tendência) e mínimo/máximo.
 */
export async function fetchSeriesInRange(
  stationIds: number[],
  startDate: string,
  endDate: string,
  groupType: GroupType = "minute",
  signal?: AbortSignal,
): Promise<Map<number, StationSeries>> {
  const series = new Map<number, StationSeries>();
  if (stationIds.length === 0) return series;

  const batches = await Promise.all(
    chunk(stationIds, MAX_IDS_PER_REQUEST).map((ids) =>
      fetchBatch(ids, startDate, endDate, groupType, signal),
    ),
  );

  const readingsByStation = new Map<number, Reading[]>();
  for (const m of batches.flat()) {
    if (m.value == null) continue;
    const id = Number(m.station_prefix_id);
    if (!Number.isFinite(id)) continue;

    const list = readingsByStation.get(id) ?? [];
    list.push({ value: m.value, date: m.date, at: parseApiUtcDate(m.date) });
    readingsByStation.set(id, list);
  }

  for (const [id, readings] of readingsByStation) {
    readings.sort((a, b) => a.at.getTime() - b.at.getTime());

    const last = readings[readings.length - 1];
    if (!last) continue;
    const previous =
      readings.length >= 2 ? readings[readings.length - 2] : null;

    let min = last.value;
    let max = last.value;
    for (const r of readings) {
      if (r.value < min) min = r.value;
      if (r.value > max) max = r.value;
    }

    series.set(id, {
      stationId: id,
      readings,
      last,
      previous,
      min,
      max,
      count: readings.length,
    });
  }
  return series;
}

/**
 * Série das estações na janela padrão (`LOOKBACK_MS` antes de `referenceDate`
 * até `referenceDate`). Usada no carregamento do mapa; a sidebar reaproveita
 * essas leituras sem nova busca. `referenceDate` é "agora" por padrão, mas o
 * usuário pode fixar outro instante (seletor de data).
 */
export function fetchStationSeries(
  stationIds: number[],
  referenceDate: Date = new Date(),
  signal?: AbortSignal,
): Promise<Map<number, StationSeries>> {
  const end = referenceDate.getTime();
  return fetchSeriesInRange(
    stationIds,
    new Date(end - LOOKBACK_MS).toISOString(),
    new Date(end).toISOString(),
    "minute",
    signal,
  );
}
