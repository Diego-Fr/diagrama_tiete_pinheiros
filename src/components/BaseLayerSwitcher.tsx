import {
  BASEMAP_THUMB_URL,
  SATELLITE_THUMB_URL,
} from "@/config/map";
import type { BaseLayerId } from "@/hooks/useSettings";

const LAYERS: { id: BaseLayerId; name: string; thumb: string }[] = [
  { id: "gray", name: "Mapa", thumb: BASEMAP_THUMB_URL },
  { id: "satellite", name: "Satélite", thumb: SATELLITE_THUMB_URL },
];

interface BaseLayerSwitcherProps {
  value: BaseLayerId;
  onChange: (id: BaseLayerId) => void;
}

/**
 * Seletor de camada base no canto inferior esquerdo — estilo Google Maps:
 * um quadrado com a camada alternativa; no hover abre a lista de opções.
 */
export default function BaseLayerSwitcher({
  value,
  onChange,
}: BaseLayerSwitcherProps) {
  const alternate = LAYERS.find((l) => l.id !== value) ?? LAYERS[0]!;

  return (
    <div className="baselayer-switcher">
      <div className="baselayer-switcher__toggle" aria-hidden="true">
        <img src={alternate.thumb} alt="" loading="lazy" />
        <span>Camadas</span>
      </div>

      <div className="baselayer-switcher__panel" role="group" aria-label="Camada base">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            type="button"
            className={`baselayer-switcher__opt${
              layer.id === value ? " baselayer-switcher__opt--active" : ""
            }`}
            aria-pressed={layer.id === value}
            onClick={() => onChange(layer.id)}
          >
            <img src={layer.thumb} alt="" loading="lazy" />
            <span>{layer.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
