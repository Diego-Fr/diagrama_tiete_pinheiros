import { barragesById } from "@/data/barrages";
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
}

/**
 * Painel da barragem selecionada no fluxo — mesma moldura/posição da
 * `StationSidebar`, mas sem gráfico: mostra a situação real das comportas
 * (`/sibh/api/v1/dams`, via `useDamStatus`). Enquanto a busca não chega
 * (carregando/erro/comporta sem evento ainda), a premissa é que está
 * ABERTA (pedido do usuário), não "sem dado".
 */
export default function BarrageSidebar({ barrageId, onClose }: BarrageSidebarProps) {
  const { data, isLoading, isError } = useDamStatus();

  if (barrageId == null) return null;
  const barrage = barragesById.get(barrageId);
  if (!barrage) return null;

  const dam = data?.get(barrage.apiDamId);
  // Sem dado real ainda (carregando/erro/API não devolveu essa barragem) —
  // cai pro fallback do gateCount, todas assumidas abertas.
  const gates =
    dam?.gates ??
    Array.from({ length: barrage.gateCount }, (_, i) => ({
      id: String(i + 1),
      open: true,
    }));

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
            const status = dam ? gateStatusOf(g.open) : DEFAULT_GATE_STATUS;
            return (
              <li key={g.id} className="barrage-sidebar__gate-row">
                <span className="barrage-sidebar__gate-name">{gateLabel(g.id)}</span>
                <span
                  className={`barrage-sidebar__gate-status barrage-sidebar__gate-status--${status}`}
                >
                  {GATE_STATUS_LABELS[status]}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

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
