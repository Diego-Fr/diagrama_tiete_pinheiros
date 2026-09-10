import { LEVEL_LABELS, LEVEL_ORDER, type LevelClass } from "@/lib/classification";

interface MapLegendProps {
  /** Níveis atualmente ocultos (clicados). */
  hidden: Set<LevelClass>;
  /** Nível sob hover — null quando o mouse sai da legenda. */
  onHover: (level: LevelClass | null) => void;
  /** Alterna a visibilidade das caixas daquele nível. */
  onToggle: (level: LevelClass) => void;
}

/**
 * Legenda interativa (parte inferior central). Hover realça o nível (as demais
 * caixas do mapa desbotam); clique oculta/mostra as caixas daquele nível.
 */
export default function MapLegend({
  hidden,
  onHover,
  onToggle,
}: MapLegendProps) {
  return (
    <div className="map-legend" onMouseLeave={() => onHover(null)}>
      {LEVEL_ORDER.map((level) => {
        const off = hidden.has(level);
        return (
          <button
            key={level}
            type="button"
            className={`map-legend__item map-legend__item--${level}${
              off ? " map-legend__item--off" : ""
            }`}
            aria-pressed={off}
            /* nível oculto → nada para realçar; não desbota os demais */
            onMouseEnter={() => onHover(off ? null : level)}
            onFocus={() => onHover(off ? null : level)}
            onBlur={() => onHover(null)}
            onClick={() => onToggle(level)}
          >
            {LEVEL_LABELS[level]}
          </button>
        );
      })}
    </div>
  );
}
