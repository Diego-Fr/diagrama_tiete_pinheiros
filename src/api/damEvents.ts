import { API_BASE } from "@/api/base";

/**
 * Salvar um evento de barragem (mudança de situação das comportas) —
 * `POST /v2/dams/events`, mesmo padrão same-origin/proxy das outras rotas
 * v2 (`API_BASE`, ver `src/api/base.ts`) — same-origin em produção,
 * proxy do Vite (`/sibh` → `apps.spaguas.sp.gov.br`) em dev. Testada
 * primeiro contra um servidor local só de desenvolvimento
 * (`localhost:11000/dams/events`, sem prefixo) até o usuário confirmar que
 * o salvamento estava correto; publicada de verdade em
 * `/sibh/api/v2/dams/events`, mesmo host/base de tudo mais.
 */

/** `event_type_id` pro tipo "mudança de status das comportas" (único usado
 * até agora, valor fixo passado pelo usuário). */
export const GATE_CHANGE_EVENT_TYPE_ID = 1;

export interface CreateDamEventInput {
  eventableId: number;
  eventTypeId: number;
  startDate: Date;
  endDate?: Date | null;
  desc?: string | null;
  options: Record<string, unknown>;
}

/**
 * Cria o evento. Corpo espelha exatamente o schema Joi passado pelo usuário
 * (`eventable_id`, `event_type_id`, `start_date`, `end_date`, `desc`,
 * `options`). Precisa do mesmo bearer token da sessão (`useAuth`).
 */
export async function createDamEvent(input: CreateDamEventInput, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/v2/dams/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      eventable_id: input.eventableId,
      event_type_id: input.eventTypeId,
      start_date: input.startDate.toISOString(),
      end_date: input.endDate ? input.endDate.toISOString() : null,
      desc: input.desc ?? null,
      options: input.options,
    }),
  });

  if (!res.ok) {
    const raw = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(raw.message ?? raw.error ?? `Falha ao salvar evento (HTTP ${res.status})`);
  }
}
