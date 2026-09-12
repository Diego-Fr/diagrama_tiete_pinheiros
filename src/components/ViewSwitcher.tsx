import { useEffect, useRef, useState } from "react";

export type AppView = "map" | "flow";

const VIEW_OPTIONS: { id: AppView; label: string }[] = [
  { id: "map", label: "Mapa" },
  { id: "flow", label: "Fluxo" },
];

interface ViewSwitcherProps {
  value: AppView;
  onChange: (view: AppView) => void;
}

/**
 * Troca de contexto (mapa geográfico ↔ diagrama de fluxo), no mesmo estilo
 * "select" do `AppTitleMenu` ao lado — card branco + chevron, abre uma lista
 * pra escolher a visualização.
 */
export default function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
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

  const active = VIEW_OPTIONS.find((v) => v.id === value) ?? VIEW_OPTIONS[0];

  return (
    <div className="view-switcher" ref={rootRef}>
      <button
        type="button"
        className="view-switcher__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="view-switcher__label">{active?.label}</span>
        <svg
          className="view-switcher__chevron"
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
        <ul className="view-switcher__list" role="listbox">
          {VIEW_OPTIONS.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                role="option"
                aria-selected={v.id === active?.id}
                className={`view-switcher__item${
                  v.id === active?.id ? " view-switcher__item--active" : ""
                }`}
                onClick={() => {
                  onChange(v.id);
                  setOpen(false);
                }}
              >
                {v.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
