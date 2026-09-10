import { API_BASE } from "@/api/base";

/**
 * Valores de referência (limiares) por estação, de
 * `/sibh/api/v2/parameters?parameterizable_type=StationPrefix&parameter_type_id=2`.
 * Todos em centímetros.
 */
export interface ReferenceThresholds {
  attention?: number;
  alert?: number;
  emergency?: number;
  extravasation?: number;
}

interface RawParameter {
  /** string na v2 (ex.: "92"). */
  parameterizable_id: string | number;
  parameter_type_id: string | number;
  values: Record<string, string | null> | null;
}

const BASE_URL = `${API_BASE}/v2/parameters`;

/** Tipo de parâmetro = valores de referência fluviométricos (nível). */
const LEVEL_PARAMETER_TYPE_ID = 2;

/** Só faz sentido para postos (StationPrefix) neste diagrama. */
const PARAMETERIZABLE_TYPE = "StationPrefix";

function toNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Busca os limiares de nível das estações. Diferente de `measurements`, este
 * endpoint aceita muitos ids numa requisição só; estações sem valores de
 * referência simplesmente não voltam.
 */
export async function fetchReferenceThresholds(
  stationIds: number[],
  signal?: AbortSignal,
): Promise<Map<number, ReferenceThresholds>> {
  const result = new Map<number, ReferenceThresholds>();
  if (stationIds.length === 0) return result;

  const params = new URLSearchParams();
  for (const id of stationIds) {
    params.append("parameterizable_ids[]", String(id));
  }
  params.set("parameterizable_type", PARAMETERIZABLE_TYPE);
  params.set("parameter_type_id", String(LEVEL_PARAMETER_TYPE_ID));

  const res = await fetch(`${BASE_URL}?${params.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`parameters: HTTP ${res.status}`);
  }
  const body = (await res.json()) as unknown;
  if (!Array.isArray(body)) return result;

  for (const item of body as RawParameter[]) {
    if (Number(item.parameter_type_id) !== LEVEL_PARAMETER_TYPE_ID) continue;
    const id = Number(item.parameterizable_id);
    if (!Number.isFinite(id)) continue;

    const v = item.values ?? {};
    result.set(id, {
      attention: toNumber(v.attention),
      alert: toNumber(v.alert),
      emergency: toNumber(v.emergency),
      extravasation: toNumber(v.extravasation),
    });
  }
  return result;
}
