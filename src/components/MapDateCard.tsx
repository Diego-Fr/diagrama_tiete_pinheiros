import { useEffect, useState } from "react";
import { formatDateTimeBR } from "@/lib/datetime";

interface MapDateCardProps {
  /** null = agora (ao vivo). */
  referenceDate: Date | null;
  onChange: (date: Date | null) => void;
  /** Muda (incrementa) para fechar o popover — clique no mapa vazio. */
  closeSignal: number;
}

function toInputValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}

/**
 * Card no canto superior direito: mostra "AGORA" (ao vivo) ou a data
 * selecionada. Clicar abre um popover para escolher outro instante — o resto
 * do app passa a olhar a janela de 6h terminando nele. Com uma data fixa
 * selecionada, aparece o botão "Agora" para voltar ao modo ao vivo.
 */
export default function MapDateCard({
  referenceDate,
  onChange,
  closeSignal,
}: MapDateCardProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    toInputValue(referenceDate ?? new Date()),
  );

  useEffect(() => {
    setDraft(toInputValue(referenceDate ?? new Date()));
  }, [referenceDate]);

  // Clique em área vazia do mapa fecha o popover, se estiver aberto.
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeSignal]);

  const isLive = referenceDate == null;
  const label = isLive ? "AGORA" : formatDateTimeBR(referenceDate);

  function apply() {
    const picked = new Date(draft);
    if (!Number.isNaN(picked.getTime())) {
      onChange(picked);
      setOpen(false);
    }
  }

  return (
    <div className="map-datecard-wrap">
      <div className="map-datecard">
        <button
          type="button"
          className="map-datecard__date"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span>{label}</span>
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>

        {!isLive && (
          <>
            <span className="map-datecard__sep" />
            <button
              type="button"
              className="map-datecard__now"
              onClick={() => onChange(null)}
            >
              Agora
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="map-datecard__popover">
          <label className="map-datecard__field">
            <span>Ver situação em:</span>
            <input
              type="datetime-local"
              value={draft}
              max={toInputValue(new Date())}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="map-datecard__apply"
            onClick={apply}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
