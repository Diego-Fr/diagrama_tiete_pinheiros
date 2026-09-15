import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { CircleMarker, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { StationSeries } from "@/api/measurements";
import type { LevelClass } from "@/lib/classification";
import { scaledBoxDims, type BoxFormat, type BoxSize } from "@/lib/boxFormat";
import { declutter } from "@/lib/declutter";
import { formatFullDateTimeBR } from "@/lib/datetime";
import { FRESHNESS_LABELS, type Freshness } from "@/lib/freshness";
import { formatMeters, trendOf } from "@/lib/stationFormat";
import { TREND_PATHS, type Trend } from "@/lib/trendIcons";
import type { LatLngTuple } from "@/hooks/useStationPositions";
import type { StationPoint } from "@/types/station";
import { useStationStatus } from "@/hooks/useStationStatus";

/**
 * Setas como SVG (não glifo de fonte) — assim `align-items: center` do flex
 * centraliza de fato, sem o deslocamento vertical que ↑/↓ têm em cada fonte.
 * Mesmo desenho (`TREND_PATHS`) usado pelo `<TrendArrow>` React (sidebar,
 * modal, tabela) — só o wrapper muda (string HTML aqui, JSX lá).
 */
const TREND_SVG: Record<Trend, string> = {
  up: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${TREND_PATHS.up}"/></svg>`,
  down: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${TREND_PATHS.down}"/></svg>`,
  flat: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${TREND_PATHS.flat}"/></svg>`,
};

/** Ponto de exclamação flutuante no canto sup. direito — atraso do dado. */
const FRESHNESS_BADGE_SVG =
  '<svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor"><path d="M10.8 4h2.4l-.5 11h-1.4L10.8 4z"/><circle cx="12" cy="19" r="1.7"/></svg>';

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

const NBSP = " "; // espaço fixo

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
  freshness: Freshness | null,
  selected: boolean,
  format: BoxFormat,
  size: BoxSize,
): L.DivIcon {
  const dims = scaledBoxDims(format, size);
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
    title = escapeHtml(formatFullDateTimeBR(series.last.at));
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

  // Aguardando/atrasado (measurement_gap) → "!" flutuante no canto sup.
  // direito da caixa; dado em dia não ganha selo nenhum.
  const badge =
    freshness && freshness !== "updated"
      ? `<div class="station-box__freshness station-box__freshness--${freshness}" title="${escapeHtml(
          FRESHNESS_LABELS[freshness],
        )}">${FRESHNESS_BADGE_SVG}</div>`
      : "";

  return L.divIcon({
    className,
    html:
      `<div class="station-box-inner"><div class="station-box station-box--${format}"${
        title ? ` title="${title}"` : ""
      }>${rows.join("")}</div>${badge}</div>`,
    iconSize: [dims.w, dims.h],
    iconAnchor: [dims.w / 2, dims.h / 2],
  });
}

/** Estação "no lugar": posição igual à coordenada real (dentro de um épsilon). */
function isAtAnchor(anchor: LatLngTuple, pos: LatLngTuple): boolean {
  return Math.abs(anchor[0] - pos[0]) < 1e-6 && Math.abs(anchor[1] - pos[1]) < 1e-6;
}

interface StationsLayerProps {
  /** Postos da área de interesse ativa (`REGION_STATIONS[region]`) —
   * referência estável por região (2026-09-14). */
  stations: StationPoint[];
  selectedId: number | null;
  boxFormat: BoxFormat;
  boxSize: BoxSize;
  /** Nível sob hover na legenda — desbota as caixas de outros níveis. */
  hoveredLevel: LevelClass | null;
  /** Níveis ocultados na legenda — suas caixas não renderizam. */
  hiddenLevels: Set<LevelClass>;
  /** Esconde caixas sem nenhuma leitura na janela (mostrando "—") — usado só
   * durante o print (botão de câmera), pra não sair no PNG com traço. */
  hideNoData: boolean;
  /** Posições ajustadas manualmente (arrastadas) — vencem o layout automático. */
  overrides: Record<number, LatLngTuple>;
  /** null = agora (ao vivo); data fixa = janela de 6h congelada nela. */
  referenceDate: Date | null;
  onSelectStation: (stationId: number) => void;
  /** Usuário soltou a caixa numa nova posição — persistir. */
  onDragStation: (stationId: number, pos: LatLngTuple) => void;
}

export default function StationsLayer({
  stations,
  selectedId,
  boxFormat,
  boxSize,
  hoveredLevel,
  hiddenLevels,
  hideNoData,
  overrides,
  referenceDate,
  onSelectStation,
  onDragStation,
}: StationsLayerProps) {
  const map = useMap();
  const stationIds = useMemo(() => stations.map((s) => s.id), [stations]);
  const { byId } = useStationStatus(stations, stationIds, referenceDate);
  const [autoPos, setAutoPos] = useState<Map<number, LatLngTuple>>(new Map());

  // Recalcula o anti-overlap em espaço de tela e converte de volta p/ lat/lng.
  // (Independe dos ajustes manuais — esses só entram na hora de exibir.)
  const solve = useCallback(() => {
    const dims = scaledBoxDims(boxFormat, boxSize);
    const items = stations.map((s) => {
      const p = map.latLngToContainerPoint([s.lat, s.lng]);
      return { id: s.id, ax: p.x, ay: p.y, hw: dims.w / 2, hh: dims.h / 2 };
    });
    const offsets = declutter(items, { gap: 5, pull: 0.04, iterations: 140 });

    const pos = new Map<number, LatLngTuple>();
    for (const it of items) {
      const off = offsets.get(it.id) ?? { dx: 0, dy: 0 };
      const ll = map.containerPointToLatLng([it.ax + off.dx, it.ay + off.dy]);
      pos.set(it.id, [ll.lat, ll.lng]);
    }
    setAutoPos(pos);
  }, [map, stations, boxFormat, boxSize]);

  // Geometria relativa só muda com zoom/resize; pan é invariante (markers
  // acompanham por lat/lng). Refaz também quando a lista de postos muda
  // (troca de área de interesse) — senão o declutter ficaria com posições
  // calculadas pra bacia anterior.
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
    for (const s of stations) {
      const status = byId.get(s.id);
      m.set(
        s.id,
        buildIcon(
          s.name,
          status?.series ?? null,
          status?.classification ?? "normal",
          status?.freshness ?? null,
          s.id === selectedId,
          boxFormat,
          boxSize,
        ),
      );
    }
    return m;
  }, [stations, byId, selectedId, boxFormat, boxSize]);

  return (
    <>
      {stations.map((s) => {
        const status = byId.get(s.id);
        const level = status?.classification ?? "normal";
        if (hiddenLevels.has(level)) return null; // ocultado na legenda
        if (hideNoData && status?.series == null) return null; // print: sem leitura ainda

        const dimmed = hoveredLevel != null && level !== hoveredLevel;
        const anchor: LatLngTuple = [s.lat, s.lng];
        const pos = overrides[s.id] ?? autoPos.get(s.id) ?? anchor;
        const isMoved = !isAtAnchor(anchor, pos);

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
              draggable
              eventHandlers={{
                click: () => onSelectStation(s.id),
                dragend: (e) => {
                  const { lat, lng } = (e.target as L.Marker).getLatLng();
                  onDragStation(s.id, [lat, lng]);
                },
              }}
            />
          </Fragment>
        );
      })}
    </>
  );
}
