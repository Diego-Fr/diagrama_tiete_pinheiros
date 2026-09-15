import { useEffect, useRef, useState } from "react";
import { AVAILABLE_DIAGRAMS } from "@/config/diagrams";

interface AppTitleMenuProps {
  value: string;
  onChange: (diagramId: string) => void;
}

/**
 * Título do app, dentro de um card branco que simula um select. Clicar abre
 * um menu com os diagramas disponíveis. Selecionar um diferente troca a
 * área de interesse (dataset de postos + diagrama curado) — controlado por
 * `App.tsx` (2026-09-14, antes só fechava o menu, não fazia nada; virou
 * controlado no mesmo padrão do `ViewSwitcher` ao lado quando um 2º
 * diagrama de verdade entrou, Ribeira de Iguape).
 */
export default function AppTitleMenu({ value, onChange }: AppTitleMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const active = AVAILABLE_DIAGRAMS.find((d) => d.id === value) ?? AVAILABLE_DIAGRAMS[0];

  return (
    <div className="app-title-menu" ref={rootRef}>
      <button
        type="button"
        className="app-title-menu__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="app-title-menu__label">{active?.label}</span>
        <svg
          className="app-title-menu__chevron"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="app-title-menu__list" role="listbox">
          {AVAILABLE_DIAGRAMS.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                role="option"
                aria-selected={d.id === active?.id}
                className={`app-title-menu__item${
                  d.id === active?.id ? " app-title-menu__item--active" : ""
                }`}
                onClick={() => {
                  onChange(d.id);
                  setOpen(false);
                }}
              >
                {d.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
