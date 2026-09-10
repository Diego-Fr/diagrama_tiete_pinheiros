import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { CircleMarker, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { StationSeries } from "@/api/measurements";
import type { LevelClass } from "@/lib/classification";
import { BOX_DIMS, type BoxFormat } from "@/lib/boxFormat";
import { declutter } from "@/lib/declutter";
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

/**
 * Setas como SVG (não glifo de fonte) — assim `align-items: center` do flex
 * centraliza de fato, sem o deslocamento vertical que ↑/↓ têm em cada fonte.
 */
const TREND_SVG: Record<Trend, string> = {
  up: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  flat: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10h12M6 14h12"/></svg>',
};

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

const NBSP = "\u00a0"; // espaço fixo

/**
 * Caixa do posto como DivIcon. Conteúdo por `format`:
 *   completo    → linha do nome (truncado) + valor/tend./m + mín/máx
 *   default     → valor/tend./m + mín/máx
 *   basico      → valor/tend./m
 *   minimalista → só o valor
 *
 * `iconAnchor` = centro da caixa → a lat/lng da estação cai no centroide.
 * `classification` pinta a caixa; `selected` põe o anel azul.
 */
function buildIcon(
  name: string,
  series: StationSeries | null,
  classification: LevelClass,
  selected: boolean,
  format: BoxFormat,
): L.DivIcon {
  const dims = BOX_DIMS[format];
  const showName = format === "completo";
  const showRange = format !== "basico" && format !== "minimalista";
  const showTrendUnit = format !== "minimalista";

  let value: string;
  let trend: Trend | null;
  let minText: string;
  let maxText: string;
  let title = "";

  if (series == null) {
    value = "—";
    trend = null;
    minText = "–";
    maxText = "–";
  } else {
    value = formatMeters(series.last.value);
    trend = trendOf(series);
    minText = `▾${NBSP}${formatMeters(series.min)}`;
    maxText = `▴${NBSP}${formatMeters(series.max)}`;
    title = escapeHtml(series.last.date);
  }

  const mainParts = [
    `<span class="station-box__value">${escapeHtml(value)}</span>`,
  ];
  if (showTrendUnit) {
    mainParts.push(
      `<span class="station-box__trend${
        trend ? ` station-box__trend--${trend}` : ""
      }">${trend ? TREND_SVG[trend] : ""}</span>`,
      `<span class="station-box__unit">m</span>`,
    );
  }

  const rows: string[] = [];
  if (showName) {
    rows.push(
      `<div class="station-box__name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>`,
    );
  }
  rows.push(`<div class="station-box__main">${mainParts.join("")}</div>`);
  if (showRange) {
    rows.push(
      `<div class="station-box__range">` +
        `<span class="station-box__min">${escapeHtml(minText)}</span>` +
        `<span class="station-box__max">${escapeHtml(maxText)}</span>` +
        `</div>`,
    );
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
      `<div class="station-box station-box--${format}"${
        title ? ` title="${title}"` : ""
      }>${rows.join("")}</div>`,
    iconSize: [dims.w, dims.h],
    iconAnchor: [dims.w / 2, dims.h / 2],
  });
}

interface StationsLayerProps {
  selectedId: number | null;
  boxFormat: BoxFormat;
  /** Nível sob hover na legenda — desbota as caixas de outros níveis. */
  hoveredLevel: LevelClass | null;
  /** Níveis ocultados na legenda — suas caixas não renderizam. */
  hiddenLevels: Set<LevelClass>;
  onSelectStation: (stationId: number) => void;
}

/** Posição de exibição de cada caixa (após declutter) + se foi deslocada. */
interface Layout {
  pos: Map<number, [number, number]>;
  moved: Set<number>;
}

export default function StationsLayer({
  selectedId,
  boxFormat,
  hoveredLevel,
  hiddenLevels,
  onSelectStation,
}: StationsLayerProps) {
  const map = useMap();
  const { byId } = useStationStatus();
  const [layout, setLayout] = useState<Layout>(() => ({
    pos: new Map(),
    moved: new Set(),
  }));

  // Recalcula o anti-overlap em espaço de tela e converte de volta p/ lat/lng.
  const solve = useCallback(() => {
    const dims = BOX_DIMS[boxFormat];
    const items = fluviometricStations.map((s) => {
      const p = map.latLngToContainerPoint([s.lat, s.lng]);
      return { id: s.id, ax: p.x, ay: p.y, hw: dims.w / 2, hh: dims.h / 2 };
    });
    const offsets = declutter(items, { gap: 5, pull: 0.04, iterations: 140 });

    const pos = new Map<number, [number, number]>();
    const moved = new Set<number>();
    for (const it of items) {
      const off = offsets.get(it.id) ?? { dx: 0, dy: 0 };
      const ll = map.containerPointToLatLng([it.ax + off.dx, it.ay + off.dy]);
      pos.set(it.id, [ll.lat, ll.lng]);
      if (Math.hypot(off.dx, off.dy) > 3) moved.add(it.id);
    }
    setLayout({ pos, moved });
  }, [map, boxFormat]);

  // Geometria relativa só muda com zoom/resize; pan é invariante (markers
  // acompanham por lat/lng).
  useEffect(() => {
    solve();
    map.on("zoomend resize", solve);
    return () => {
      map.off("zoomend resize", solve);
    };
  }, [map, solve]);

  // Ícones mudam quando chega/atualiza série, classificação ou seleção.
  const icons = useMemo(() => {
    const m = new Map<number, L.DivIcon>();
    for (const s of fluviometricStations) {
      const status = byId.get(s.id);
      m.set(
        s.id,
        buildIcon(
          s.name,
          status?.series ?? null,
          status?.classification ?? "normal",
          s.id === selectedId,
          boxFormat,
        ),
      );
    }
    return m;
  }, [byId, selectedId, boxFormat]);

  return (
    <>
      {fluviometricStations.map((s) => {
        const level = byId.get(s.id)?.classification ?? "normal";
        if (hiddenLevels.has(level)) return null; // ocultado na legenda

        const dimmed = hoveredLevel != null && level !== hoveredLevel;
        const anchor: [number, number] = [s.lat, s.lng];
        const pos = layout.pos.get(s.id) ?? anchor;
        const isMoved = layout.moved.has(s.id);
        return (
          <Fragment key={s.id}>
            {isMoved && (
              <>
                <Polyline
                  positions={[anchor, pos]}
                  interactive={false}
                  pathOptions={{
                    color: "#111827",
                    weight: 1.2,
                    opacity: dimmed ? 0.12 : 0.9,
                    dashArray: "3 3",
                  }}
                />
                <CircleMarker
                  center={anchor}
                  radius={3}
                  interactive={false}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 1,
                    opacity: dimmed ? 0.15 : 1,
                    fillColor: "#111827",
                    fillOpacity: dimmed ? 0.15 : 1,
                  }}
                />
              </>
            )}
            <Marker
              position={pos}
              icon={icons.get(s.id)!}
              title={s.name}
              opacity={dimmed ? 0.12 : 1}
              eventHandlers={{ click: () => onSelectStation(s.id) }}
            />
          </Fragment>
        );
      })}
    </>
  );
}
