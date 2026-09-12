import { useEffect, useRef, useState } from "react";
import { createDamEvent, GATE_CHANGE_EVENT_TYPE_ID } from "@/api/damEvents";
import { barragesById } from "@/data/barrages";
import type { AuthState } from "@/hooks/useAuth";
import { formatFullDateTimeBR } from "@/lib/datetime";
import {
  DEFAULT_GATE_STATUS,
  GATE_STATUS_LABELS,
  gateLabel,
  gateStatusOf,
} from "@/lib/gateStatus";
import { useDamStatus } from "@/hooks/useDamStatus";

interface BarrageSidebarProps {
  barrageId: string | null;
  onClose: () => void;
  /** `useAuth()` chamado uma vez só em `App.tsx` — ver comentário no hook. */
  auth: AuthState;
}

/** Papéis autorizados a mexer nas comportas (resposta de `/v2/auth/me`). */
const EDITABLE_ROLES = new Set(["dev", "operator"]);

/** Compara dois snapshots {gateId: aberta?} — usado só pra saber se há
 * alteração pendente (não precisa de deep-equal genérico). */
function sameGates(a: Record<string, boolean>, b: Record<string, boolean>): boolean {
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((k) => a[k] === b[k]);
}

/**
 * Painel da barragem selecionada no fluxo — mesma moldura/posição da
 * `StationSidebar`, mas sem gráfico: mostra a situação real das comportas
 * (`/sibh/api/v1/dams`, via `useDamStatus`). Enquanto a busca não chega
 * (carregando/erro/comporta sem evento ainda), a premissa é que está
 * ABERTA (pedido do usuário), não "sem dado".
 *
 * **Edição (2026-09-12)**: usuário autenticado com role `dev`/`operator`
 * pode clicar em cada comporta pra alternar aberta/fechada (estado local,
 * `pending`) e salvar via `POST /dams/events` (`createDamEvent`) quando
 * houver alteração pendente — vai pra `barrage.apiDamId` de verdade (1=
 * Penha, 2=Móvel; a trava temporária que mandava tudo pra uma DAM de teste
 * foi removida depois do usuário confirmar que o salvamento estava
 * correto). Quem não está logado ou não tem um desses papéis mantém o
 * comportamento de sempre: só visualiza, sem nenhuma interação.
 */
export default function BarrageSidebar({ barrageId, onClose, auth }: BarrageSidebarProps) {
  const { data, isLoading, isError } = useDamStatus();

  const canEdit =
    !!auth.user && auth.user.roles.some((r) => EDITABLE_ROLES.has(r));

  const barrage = barrageId ? barragesById.get(barrageId) : undefined;
  const dam = barrage ? data?.get(barrage.apiDamId) : undefined;
  // Sem dado real ainda (carregando/erro/API não devolveu essa barragem) —
  // cai pro fallback do gateCount, todas assumidas abertas.
  const fallbackGates = barrage
    ? Array.from({ length: barrage.gateCount }, (_, i) => ({ id: String(i + 1), open: true }))
    : [];
  const gates = dam?.gates ?? fallbackGates;

  // `pending` = estado local editável (id → aberta?), semeado a partir do
  // dado real assim que chega; `baseline` = último valor confirmado
  // (salvo ou recém-sincronizado) — a diferença entre os dois é que mostra
  // o botão "Salvar". Ver nota extensa no useEffect abaixo sobre não
  // sobrescrever edição em andamento.
  const [pending, setPending] = useState<Record<string, boolean> | null>(null);
  const [baseline, setBaseline] = useState<Record<string, boolean> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Marca pra qual barragem/estado de `dam` o `pending` atual já foi
  // sincronizado — evita resemear (e perder edição em andamento) a cada
  // refetch de 60s do `useDamStatus` depois que o dado real já chegou.
  const syncedRef = useRef<{ barrageId: string | null; hasRealData: boolean }>({
    barrageId: null,
    hasRealData: false,
  });
  // Trava síncrona contra duplo-clique: `disabled={saving}` já bloqueia o
  // botão, mas o atributo só reflete no DOM depois do próximo render — um
  // clique duplo bem rápido (dois eventos antes do React repintar) ainda
  // poderia disparar `handleSave` duas vezes. Checar/marcar esse ref logo
  // na 1ª linha da função fecha essa janela, já que é síncrono.
  const savingRef = useRef(false);

  useEffect(() => {
    if (barrageId == null) {
      setPending(null);
      setBaseline(null);
      syncedRef.current = { barrageId: null, hasRealData: false };
      return;
    }
    const alreadySynced =
      syncedRef.current.barrageId === barrageId &&
      (syncedRef.current.hasRealData || dam == null);
    if (alreadySynced) return;

    const snapshot: Record<string, boolean> = {};
    for (const g of gates) snapshot[g.id] = g.open;
    setPending(snapshot);
    setBaseline(snapshot);
    setSaveError(null);
    setSaved(false);
    syncedRef.current = { barrageId, hasRealData: dam != null };
    // `gates`/`fallbackGates` são recalculados a cada render (novo array) —
    // usar só `barrageId`/`dam` como dependência evita loop infinito;
    // `alreadySynced` acima já garante que só resemeia quando de fato muda
    // de barragem ou o dado real chega pela 1ª vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barrageId, dam]);

  if (barrageId == null || !barrage) return null;

  const isDirty = !!pending && !!baseline && !sameGates(pending, baseline);

  const toggleGate = (gateId: string) => {
    if (!canEdit || saving) return;
    setPending((prev) => (prev ? { ...prev, [gateId]: !prev[gateId] } : prev));
    setSaveError(null);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!pending || !auth.token || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await createDamEvent(
        {
          eventableId: barrage.apiDamId,
          eventTypeId: GATE_CHANGE_EVENT_TYPE_ID,
          startDate: new Date(),
          endDate: null,
          desc: "Mudança status comportas",
          // Mesmo formato do `last_event.options.gates` de produção (ver
          // `src/api/dams.ts`): objeto indexado por posição ("0","1",...),
          // cada entrada com `id`/`status` como STRING "true"/"false" — não
          // array, não número (formato passado pelo usuário, diferente do
          // que a 1ª versão desse POST mandava).
          options: {
            gates: Object.fromEntries(
              Object.entries(pending).map(([id, open], index) => [
                String(index),
                { id, status: open ? "true" : "false" },
              ]),
            ),
          },
        },
        auth.token,
      );
      setBaseline(pending);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Não foi possível salvar as comportas.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <aside className="station-sidebar barrage-sidebar" role="dialog" aria-label={barrage.name}>
      <button
        type="button"
        className="station-sidebar__close"
        onClick={onClose}
        aria-label="Fechar"
      >
        ×
      </button>

      <header className="station-sidebar__head">
        <h2 className="station-sidebar__name">{barrage.name}</h2>
        <p className="station-sidebar__meta">
          <span>{barrage.location}</span>
        </p>
      </header>

      {dam?.updatedAt && (
        <p className="barrage-sidebar__updated">
          Atualizado em {formatFullDateTimeBR(dam.updatedAt)}
        </p>
      )}

      <div className="barrage-sidebar__gates">
        <h3 className="barrage-sidebar__gates-title">
          Comportas ({gates.length})
        </h3>
        <ul className="barrage-sidebar__gates-list">
          {gates.map((g) => {
            const open = pending ? pending[g.id] : g.open;
            const status = pending ? gateStatusOf(open) : dam ? gateStatusOf(g.open) : DEFAULT_GATE_STATUS;
            const nameEl = <span className="barrage-sidebar__gate-name">{gateLabel(g.id)}</span>;
            const statusEl = (
              <span className={`barrage-sidebar__gate-status barrage-sidebar__gate-status--${status}`}>
                {GATE_STATUS_LABELS[status]}
              </span>
            );
            // Clique alterna a comporta — no item TODO (não só na pílula de
            // status), pedido do usuário.
            return canEdit ? (
              <li key={g.id} className="barrage-sidebar__gate-row-item">
                <button
                  type="button"
                  className="barrage-sidebar__gate-row barrage-sidebar__gate-row--editable"
                  onClick={() => toggleGate(g.id)}
                  disabled={saving}
                >
                  {nameEl}
                  {statusEl}
                </button>
              </li>
            ) : (
              <li key={g.id} className="barrage-sidebar__gate-row">
                {nameEl}
                {statusEl}
              </li>
            );
          })}
        </ul>
      </div>

      {canEdit && isDirty && (
        <div className="barrage-sidebar__save-bar">
          {saveError && <p className="barrage-sidebar__error">{saveError}</p>}
          <button
            type="button"
            className="barrage-sidebar__save-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <span className="barrage-sidebar__spinner" aria-hidden="true" />}
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}
      {canEdit && !isDirty && saved && (
        <p className="barrage-sidebar__saved-note">Alterações salvas.</p>
      )}

      {isLoading && (
        <p className="barrage-sidebar__note">Carregando situação real das comportas…</p>
      )}
      {isError && (
        <p className="barrage-sidebar__note">
          Não foi possível buscar a situação real das comportas agora — mostrando
          todas como abertas (premissa padrão).
        </p>
      )}
    </aside>
  );
}
