import { GeoJSON, Marker, Pane } from "react-leaflet";
import L, { type PathOptions } from "leaflet";
import type { Feature, Position } from "geojson";
import { RIVER_FLOW_DIRECTIONS, type FlowDirection } from "@/config/rivers";
import { useRivers } from "@/hooks/useRivers";

const BASE_STYLE: PathOptions = {
  color: "#1e5fbf",
  weight: 4,
  opacity: 0.85,
  lineCap: "round",
  lineJoin: "round",
};

/** Maior sub-linha da geometria (LineString ou MultiLineString). */
function longestLine(geometry: Feature["geometry"]): Position[] {
  if (geometry.type === "LineString") return geometry.coordinates;
  if (geometry.type === "MultiLineString") {
    return geometry.coordinates.reduce(
      (longest, seg) => (seg.length > longest.length ? seg : longest),
      [] as Position[],
    );
  }
  return [];
}

function rawRiverName(feature: Feature): string {
  const p = (feature.properties ?? {}) as Record<string, unknown>;
  return String(p.NomeTrecho ?? p.nome ?? "Rio");
}

function escapeHtml(value: string): string {
  return value.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

function desiredDirection(name: string): FlowDirection | null {
  return RIVER_FLOW_DIRECTIONS.find((r) => r.match.test(name))?.direction ?? null;
}

/**
 * A vazão real (ex.: "Pinheiros corre pra cima") pode ir a favor ou contra a
 * ordem dos vértices do GeoJSON — varia por rio e por trecho. Resolve
 * comparando o sentido desejado com o vetor 1º→último vértice do trecho.
 */
function isReversed(feature: Feature): boolean {
  const direction = desiredDirection(rawRiverName(feature));
  if (!direction) return false;

  const coords = longestLine(feature.geometry);
  if (coords.length < 2) return false;
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const dx = last[0]! - first[0]!; // > 0 → ordem dos vértices vai p/ leste
  const dy = last[1]! - first[1]!; // > 0 → ordem dos vértices vai p/ norte

  switch (direction) {
    case "up":
      return dy < 0;
    case "down":
      return dy > 0;
    case "right":
      return dx < 0;
    case "left":
      return dx > 0;
  }
}

/** Faixa clara tracejada por cima da base — a animação CSS a faz "correr". */
function flowStyle(feature?: Feature): PathOptions {
  return {
    color: "#8fc4ff",
    weight: 4,
    opacity: 0.95,
    lineCap: "butt",
    dashArray: "10 14",
    className:
      feature && isReversed(feature)
        ? "river-flow river-flow--rev"
        : "river-flow",
  };
}

/** Ponto ~no meio do maior segmento — âncora do rótulo. */
function labelAnchor(feature: Feature): [number, number] | null {
  const coords = longestLine(feature.geometry);
  if (coords.length < 2) return null;
  // ~70% ao longo do traçado: costuma cair num trecho mais livre de caixas
  const at = coords[Math.floor(coords.length * 0.7)]!;
  return [at[1]!, at[0]!];
}

/**
 * Um rio pode vir fatiado em vários trechos com o mesmo NomeTrecho — mostra
 * um único rótulo por nome (o do trecho mais longo), pra não empilhar labels.
 */
function pickLabelFeatures(features: Feature[]): Feature[] {
  const byName = new Map<string, Feature>();
  for (const feature of features) {
    const name = rawRiverName(feature);
    const len = longestLine(feature.geometry).length;
    const current = byName.get(name);
    if (!current || len > longestLine(current.geometry).length) {
      byName.set(name, feature);
    }
  }
  return [...byName.values()];
}

interface RiversLayerProps {
  /** Liga/desliga a faixa animada do sentido da vazão. */
  flowAnimation: boolean;
}

/**
 * Rios principais (GeoJSON do WFS do DAEE) numa pane própria (z-index 350),
 * abaixo das linhas-guia e das caixas. Traço base + faixa animada (sentido da
 * vazão, por rio) + um rótulo discreto por rio perto do curso.
 */
export default function RiversLayer({ flowAnimation }: RiversLayerProps) {
  const { data } = useRivers();
  if (!data || data.features.length === 0) return null;

  return (
    <Pane name="rivers" style={{ zIndex: 350 }}>
      <GeoJSON
        key="river-base"
        data={data}
        interactive={false}
        style={() => BASE_STYLE}
      />
      {flowAnimation && (
        <GeoJSON
          key="river-flow"
          data={data}
          interactive={false}
          style={flowStyle}
        />
      )}
      {pickLabelFeatures(data.features).map((feature, i) => {
        const anchor = labelAnchor(feature);
        if (!anchor) return null;
        return (
          <Marker
            key={`river-label-${feature.id ?? i}`}
            position={anchor}
            interactive={false}
            icon={L.divIcon({
              className: "river-label",
              html: escapeHtml(rawRiverName(feature)),
              iconSize: [140, 16],
              iconAnchor: [70, 8],
            })}
          />
        );
      })}
    </Pane>
  );
}
