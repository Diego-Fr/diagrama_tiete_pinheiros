export type ViewMode = "chart" | "table";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/** Alterna entre "ver formato gráfico" e "ver formato tabelar". */
export default function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Formato de exibição">
      <button
        type="button"
        className={`view-toggle__btn${mode === "chart" ? " view-toggle__btn--active" : ""}`}
        aria-pressed={mode === "chart"}
        onClick={() => onChange("chart")}
      >
        Gráfico
      </button>
      <button
        type="button"
        className={`view-toggle__btn${mode === "table" ? " view-toggle__btn--active" : ""}`}
        aria-pressed={mode === "table"}
        onClick={() => onChange("table")}
      >
        Tabela
      </button>
    </div>
  );
}
