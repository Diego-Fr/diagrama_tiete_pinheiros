import { useMemo } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import type { StationSeries } from "@/api/measurements";
import type { LevelClass } from "@/lib/classification";
import { fluviometricStations } from "@/data/stations";
import { useStationStatus } from "@/hooks/useStationStatus";

/** Valor da API vem em centímetros; a caixa exibe metros com 3 casas. */
function formatMeters(centimeters: number): string {
  return (centimeters / 100).toFixed(3);
}

type Trend = "up" | "down" | "flat";

/** Tendência simples: penúltima leitura vs. última. */
function trendOf(series: StationSeries): Trend {
  const previous = series.previous?.value;
  if (previous == null || series.last.value === previous) return "flat";
  return series.last.value > previous ? "up" : "down";
}

const TREND_GLYPH: Record<Trend, string> = { up: "↑", down: "↓", flat: "=" };

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] ?? c,
  );
}

/** Dimensões da caixa; devem bater com `.station-box` no CSS. */
const BOX_W = 112;
const BOX_H = 38;

/**
 * Caixa do posto como DivIcon (elemento DOM real → hover via CSS, drag nativo
 * do Marker, reposicionamento automático no pan/zoom).
 *
 *   linha 1:  [ valor em metros (>=50%) | seta de tendência | "m" ]
 *   linha 2:  [ ▾ mínimo da série       |      ▴ máximo da série    ]
 *
 * `iconAnchor` = centro da caixa → a lat/lng da estação cai no centroide.
 * `classification` pinta a caixa conforme o nível atual; `selected` põe o anel azul.
 */
function buildIcon(
  series: StationSeries | null,
  classification: LevelClass,
  selected: boolean,
): L.DivIcon {
  let main: string;
  let range: string;
  let title = "";

  if (series == null) {
    main =
      `<span class="station-box__value">—</span>` +
      `<span class="station-box__trend"></span>` +
      `<span class="station-box__unit">m</span>`;
    range =
      `<span class="station-box__min">–</span>` +
      `<span class="station-box__max">–</span>`;
  } else {
    const trend = trendOf(series);
    main =
      `<span class="station-box__value">${formatMeters(series.last.value)}</span>` +
      `<span class="station-box__trend station-box__trend--${trend}">${TREND_GLYPH[trend]}</span>` +
      `<span class="station-box__unit">m</span>`;
    range =
      `<span class="station-box__min">▾&nbsp;${formatMeters(series.min)}</span>` +
      `<span class="station-box__max">▴&nbsp;${formatMeters(series.max)}</span>`;
    title = escapeHtml(series.last.date);
  }

  const className = [
    "station-box-wrapper",
    classification !== "normal" && `station-box-wrapper--${classification}`,
    selected && "station-box-wrapper--selected",
  ]
    .filter(Boolean)
    .join(" ");

  return L.divIcon({
    className,
    html:
      `<div class="station-box"${title ? ` title="${title}"` : ""}>` +
      `<div class="station-box__main">${main}</div>` +
      `<div class="station-box__range">${range}</div>` +
      `</div>`,
    iconSize: [BOX_W, BOX_H],
    iconAnchor: [BOX_W / 2, BOX_H / 2],
  });
}

interface StationsLayerProps {
  selectedId: number | null;
  onSelectStation: (stationId: number) => void;
}

export default function StationsLayer({
  selectedId,
  onSelectStation,
}: StationsLayerProps) {
  const { byId } = useStationStatus();

  // Ícones mudam quando chega/atualiza série, classificação ou seleção.
  const icons = useMemo(() => {
    const map = new Map<number, L.DivIcon>();
    for (const s of fluviometricStations) {
      const status = byId.get(s.id);
      map.set(
        s.id,
        buildIcon(
          status?.series ?? null,
          status?.classification ?? "normal",
          s.id === selectedId,
        ),
      );
    }
    return map;
  }, [byId, selectedId]);

  return (
    <>
      {fluviometricStations.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={icons.get(s.id)!}
          title={s.name}
          eventHandlers={{ click: () => onSelectStation(s.id) }}
        />
      ))}
    </>
  );
}
