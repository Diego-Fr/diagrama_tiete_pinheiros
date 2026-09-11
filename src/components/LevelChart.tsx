import { useMemo, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import type { Reading } from "@/api/measurements";
import type { ReferenceThresholds } from "@/api/parameters";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip,
  annotationPlugin,
  zoomPlugin,
);

const THRESHOLD_STYLE = {
  attention: { label: "atenção", color: "#ca8a04" },
  alert: { label: "alerta", color: "#ea580c" },
  emergency: { label: "emergência", color: "#9333ea" },
  extravasation: { label: "extravasamento", color: "#dc2626" },
} as const;

const THRESHOLD_KEYS = Object.keys(
  THRESHOLD_STYLE,
) as (keyof ReferenceThresholds)[];

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtTime = (ms: number) => {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtDateTime = (ms: number) => {
  const d = new Date(ms);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} ${fmtTime(ms)}`;
};

interface LevelChartProps {
  readings: Reading[];
  thresholds: ReferenceThresholds;
  /** true no modal → eixo X com data + hora e mais ticks. */
  wide?: boolean;
}

/**
 * Linha do nível (m) ao longo do tempo (Chart.js). Uma série só → sem legenda.
 * O domínio Y é esticado para incluir TODOS os limiares definidos, mesmo
 * distantes da linha (contexto), desenhados como anotações tracejadas.
 */
export default function LevelChart({
  readings,
  thresholds,
  wide = false,
}: LevelChartProps) {
  const config = useMemo(() => {
    const points = readings
      .map((r) => ({ x: r.at.getTime(), y: r.value / 100 }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (points.length < 2) return null;

    const ys = points.map((p) => p.y);
    const thrVals = THRESHOLD_KEYS.map((k) => thresholds[k])
      .filter((v): v is number => v != null)
      .map((v) => v / 100);
    const lo = Math.min(...ys, ...thrVals);
    const hi = Math.max(...ys, ...thrVals);
    const pad = (hi - lo) * 0.08 || 0.05;

    const annotations: Record<string, object> = {};
    for (const key of THRESHOLD_KEYS) {
      const v = thresholds[key];
      if (v == null) continue;
      const s = THRESHOLD_STYLE[key];
      const meters = (v / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      annotations[key] = {
        type: "line",
        yMin: v / 100,
        yMax: v / 100,
        borderColor: s.color,
        borderWidth: 1,
        borderDash: [4, 3],
        label: {
          display: true,
          content: `${s.label} — ${meters} m`,
          position: "end",
          backgroundColor: "rgba(255,255,255,0.85)",
          color: s.color,
          font: { size: 9, weight: "bold" },
          padding: 2,
          yAdjust: -8,
        },
      };
    }

    const fmtX = wide ? fmtDateTime : fmtTime;

    const data: ChartData<"line", { x: number; y: number }[]> = {
      datasets: [
        {
          data: points,
          borderColor: "#0369a1",
          borderWidth: 2,
          fill: true,
          backgroundColor: "rgba(3,105,161,0.10)",
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#0369a1",
          pointHoverBorderColor: "#ffffff",
          tension: 0.25,
        },
      ],
    };

    const options: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          type: "linear",
          min: points[0]!.x,
          max: points[points.length - 1]!.x,
          grid: { color: "#eef2f6" },
          ticks: {
            color: "#64748b",
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: wide ? 8 : 5,
            callback: (value) => fmtX(Number(value)),
          },
        },
        y: {
          min: lo - pad,
          max: hi + pad,
          grid: { color: "#eef2f6" },
          ticks: {
            color: "#64748b",
            font: { size: 10 },
            callback: (value) => Number(value).toFixed(2),
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (items: TooltipItem<"line">[]) =>
              fmtDateTime(Number(items[0]?.parsed.x)),
            label: (item: TooltipItem<"line">) =>
              `${item.parsed.y.toFixed(3)} m`,
          },
        },
        annotation: { annotations },
        // zoom só no modal e só no eixo X — o eixo Y (com os limiares) nunca muda.
        // Zoom por caixa de seleção (click + drag), não por scroll.
        zoom: wide
          ? {
              pan: { enabled: false },
              zoom: {
                mode: "x",
                wheel: { enabled: false },
                pinch: { enabled: false },
                drag: {
                  enabled: true,
                  backgroundColor: "rgba(3,105,161,0.15)",
                  borderColor: "#0369a1",
                  borderWidth: 1,
                },
              },
              limits: { x: { min: "original", max: "original" } },
            }
          : undefined,
      },
    };

    return { data, options };
  }, [readings, thresholds, wide]);

  const chartRef = useRef<ChartJS<"line"> | null>(null);

  if (!config) {
    return <p className="level-chart__empty">Sem dados suficientes no período.</p>;
  }

  return (
    <div className="level-chart">
      {wide && (
        <button
          type="button"
          className="level-chart__reset"
          onClick={() => chartRef.current?.resetZoom()}
          title="Resetar zoom"
        >
          ↺
        </button>
      )}
      <Line ref={chartRef} data={config.data} options={config.options} />
    </div>
  );
}
