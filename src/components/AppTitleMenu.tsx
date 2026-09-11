import { useEffect, useRef, useState } from "react";
import { AVAILABLE_DIAGRAMS } from "@/config/diagrams";

/**
 * Título do app, dentro de um card branco que simula um select. Clicar abre
 * um menu com os diagramas disponíveis (por enquanto só um). Selecionar o
 * diagrama atual não faz nada além de fechar o menu — a lista existe para
 * quando houver mais de um diagrama.
 */
export default function AppTitleMenu() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(AVAILABLE_DIAGRAMS[0]?.id);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const active =
    AVAILABLE_DIAGRAMS.find((d) => d.id === activeId) ?? AVAILABLE_DIAGRAMS[0];

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
                  setActiveId(d.id);
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
