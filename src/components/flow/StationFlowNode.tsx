import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { StationSeries } from "@/api/measurements";
import type { BoxFormat } from "@/lib/boxFormat";
import type { LevelClass } from "@/lib/classification";
import { formatFullDateTimeBR } from "@/lib/datetime";
import { FRESHNESS_LABELS, type Freshness } from "@/lib/freshness";
import { formatMeters, trendOf } from "@/lib/stationFormat";
import TrendArrow from "@/components/TrendArrow";
import { CENTERED_HANDLE_STYLE } from "@/components/flow/handleStyle";

const NBSP = " "; // espaço fixo, mesmo texto usado na caixa do mapa

export interface StationFlowNodeData extends Record<string, unknown> {
  stationId: number;
  name: string;
  series: StationSeries | null;
  classification: LevelClass;
  freshness: Freshness | null;
  format: BoxFormat;
  selected: boolean;
  onSelect: (stationId: number) => void;
}

export type StationNode = Node<StationFlowNodeData, "station">;

/**
 * Caixa do posto no diagrama de fluxo — mesmo visual/classes CSS e mesma
 * lógica condicional por formato da caixa do mapa (`.station-box*`,
 * `StationsLayer.buildIcon`). Handle invisível centralizado
 * (`CENTERED_HANDLE_STYLE`) — pipes/leaders que terminam aqui "desaparecem"
 * atrás da caixa, igual ao padrão de leader-line do mapa. Clique abre a
 * mesma sidebar/modal do mapa (`onSelect`, repassado de `App.tsx`).
 */
export default function StationFlowNode({ data }: NodeProps<StationNode>) {
  const { stationId, name, series, classification, freshness, format, selected, onSelect } =
    data;

  const showName = format === "completo";
  const showRange = format !== "basico" && format !== "minimalista";
  const showTrendUnit = format !== "minimalista";

  const value = series ? formatMeters(series.last.value) : "—";
  const trend = series ? trendOf(series) : null;
  const minText = series ? `▾${NBSP}${formatMeters(series.min)}` : "–";
  const maxText = series ? `▴${NBSP}${formatMeters(series.max)}` : "–";
  const title = series ? formatFullDateTimeBR(series.last.at) : undefined;

  const wrapperClass = [
    "station-box-wrapper",
    classification !== "normal" && `station-box-wrapper--${classification}`,
    selected && "station-box-wrapper--selected",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flow-station-node">
      <Handle
        type="target"
        position={Position.Top}
        style={CENTERED_HANDLE_STYLE}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Top}
        style={CENTERED_HANDLE_STYLE}
        isConnectable={false}
      />
      <div
        className={wrapperClass}
        title={name}
        onClick={() => onSelect(stationId)}
        role="button"
        tabIndex={0}
      >
        <div className="station-box-inner">
          <div className={`station-box station-box--${format}`} title={title}>
            {showName && (
              <div className="station-box__name" title={name}>
                {name}
              </div>
            )}
            <div className="station-box__main">
              <span className="station-box__value">{value}</span>
              {showTrendUnit && (
                <>
                  <span
                    className={`station-box__trend${
                      trend ? ` station-box__trend--${trend}` : ""
                    }`}
                  >
                    {trend && <TrendArrow trend={trend} size={13} />}
                  </span>
                  <span className="station-box__unit">m</span>
                </>
              )}
            </div>
            {showRange && (
              <div className="station-box__range">
                <span className="station-box__min">{minText}</span>
                <span className="station-box__max">{maxText}</span>
              </div>
            )}
          </div>
          {freshness && freshness !== "updated" && (
            <div
              className={`station-box__freshness station-box__freshness--${freshness}`}
              title={FRESHNESS_LABELS[freshness]}
            >
              <svg
                viewBox="0 0 24 24"
                width="9"
                height="9"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10.8 4h2.4l-.5 11h-1.4L10.8 4z" />
                <circle cx="12" cy="19" r="1.7" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
