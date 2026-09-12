/**
 * Salvar um evento de barragem (mudança de situação das comportas) —
 * `POST /dams/events`. **Ainda não existe em produção** (só no servidor
 * local de teste do usuário, `localhost:11000`) — por isso essa rota NÃO
 * passa pelo proxy `/sibh` do Vite (que aponta pra
 * `apps.spaguas.sp.gov.br`), vai direto pro host local. Quando a rota for
 * publicada de verdade, isso passa a valer o mesmo tratamento das outras
 * (`API_BASE`/proxy).
 */
const DAM_EVENTS_BASE = "http://localhost:11000";

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
  const res = await fetch(`${DAM_EVENTS_BASE}/dams/events`, {
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
