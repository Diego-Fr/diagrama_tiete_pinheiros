import { API_BASE } from "@/api/base";

/**
 * Situação das comportas de uma barragem, de
 * `/sibh/api/v1/dams?ids[]=...&with_last_event=true&custom_fields[]=last_event`.
 *
 * `params.gates` dá a lista definitiva de comportas daquela barragem (ids
 * numéricos "1".."6", ou "F-1"/"F-2" nas comportas de fundo da Barragem
 * Móvel) — sempre presente, mesmo sem evento nenhum ainda. `last_event[0]`
 * (quando existe) tem a situação de cada comporta no momento mais recente,
 * dentro de `options.gates` (objeto indexado por posição "0","1",...; cada
 * entrada tem o `id` da comporta e `status` como STRING "true"/"false" —
 * não booleano de verdade).
 */
export interface DamGate {
  /** "1".."6", ou "F-1"/"F-2" (comportas de fundo). */
  id: string;
  open: boolean;
}

export interface DamStatus {
  apiDamId: number;
  name: string;
  gates: DamGate[];
  /** Quando a situação atual passou a valer (`last_event[0].start_date`) —
   * null se não há nenhum evento registrado ainda. */
  updatedAt: Date | null;
}

interface RawDamGateParam {
  id: string | number;
  status: number;
}
interface RawDamEventGate {
  id: string;
  status: string;
}
interface RawDamEvent {
  start_date: string;
  options?: {
    gates?: Record<string, RawDamEventGate>;
  };
}
interface RawDam {
  id: number;
  name: string;
  params?: { gates?: RawDamGateParam[] };
  last_event?: RawDamEvent[];
}

/**
 * Busca a situação das comportas das barragens pedidas. Sem evento
 * registrado pra uma comporta, assume ABERTA (mesma premissa já adotada na
 * ausência de dado — ver `src/lib/gateStatus.ts`).
 */
export async function fetchDams(
  damIds: number[],
  signal?: AbortSignal,
): Promise<Map<number, DamStatus>> {
  const result = new Map<number, DamStatus>();
  if (damIds.length === 0) return result;

  const params = new URLSearchParams();
  for (const id of damIds) params.append("ids[]", String(id));
  params.append("with_last_event", "true");
  params.append("additional_fields[]", "");
  params.append("custom_fields[]", "last_event");

  const res = await fetch(`${API_BASE}/v1/dams?${params.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`dams: HTTP ${res.status}`);
  }
  const raw = (await res.json()) as unknown;
  if (!Array.isArray(raw)) return result;

  for (const dam of raw as RawDam[]) {
    const event = dam.last_event?.[0];
    const eventGates = event?.options?.gates ? Object.values(event.options.gates) : [];
    const gateIds = (dam.params?.gates ?? []).map((g) => String(g.id));

    const gates: DamGate[] = gateIds.map((id) => {
      const found = eventGates.find((g) => String(g.id) === id);
      return { id, open: found ? found.status === "true" : true };
    });

    result.set(dam.id, {
      apiDamId: dam.id,
      name: dam.name,
      gates,
      // "Z" no fim da string já indica UTC — new Date() resolve certo
      // sozinho, sem precisar do parser manual usado pra measurements.
      updatedAt: event ? new Date(event.start_date) : null,
    });
  }
  return result;
}
