import { useMemo, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Filler,
  Legend,
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
import { formatDateTimeBR, formatTimeBR } from "@/lib/datetime";
import type { JusanteChartSeries } from "@/lib/stationFormat";

// `Legend` registrado (2026-09-15) — só passa a aparecer quando há 2 séries
// (`secondary`, ver `plugins.legend.display` abaixo); sem registrar
// aqui, `legend:{display:true}` nas options não tem efeito nenhum (Chart.js
// v4 exige o componente registrado, igual `Tooltip`/`Filler`).
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
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

// Horário de Brasília, explícito (independe do fuso do navegador).
const fmtTime = (ms: number) => formatTimeBR(new Date(ms));
const fmtDateTime = (ms: number) => formatDateTimeBR(new Date(ms));

interface LevelChartProps {
  readings: Reading[];
  thresholds: ReferenceThresholds;
  /** 2ª série (2026-09-15), quando existe — desenhada como 2ª linha num
   * eixo Y PRÓPRIO à direita (`ySecondary`), sem compartilhar escala com
   * a cota (pedido explícito do usuário: "coloca essa serie em eixo
   * oposto, nao compartilhe eixos" — as duas grandezas não têm por que
   * estar na mesma faixa de valores). Hoje vem de 2 fontes possíveis
   * (`StationSidebar`/`StationModal` decidem qual, o componente só plota):
   * a jusante de uma UHE de reservatório, ou a vazão do próprio posto
   * selecionado (`buildJusanteChartSeries`/`buildFlowChartSeries` em
   * `stationFormat.ts`). Ausente/vazia = como antes (1 linha só, sem
   * legenda). */
  secondary?: JusanteChartSeries;
  /** true no modal → eixo X com data + hora e mais ticks. */
  wide?: boolean;
}

/** Mesma paleta usada na caixa de reservatório do diagrama (`.reservoir-box__label--*`
 * em `index.css`) — cota = azul, jusante/vazão = vermelho — pra quem já
 * viu a caixa reconhecer a mesma associação de cor no gráfico. */
const COTA_COLOR = "#0369a1";
const SECONDARY_COLOR = "#dc2626";

/**
 * Linha do nível (m) ao longo do tempo (Chart.js). Uma série só → sem legenda
 * (o título já diz o que é). Com `secondary`, uma 2ª linha entra num eixo Y
 * próprio à direita (`ySecondary`) e a legenda aparece pra distinguir as
 * duas — o rótulo/unidade vêm prontos em `secondary.label`/`secondary.unit`
 * (o componente não decide nível-vs-vazão, quem chama já resolve isso e
 * manda o bundle pronto, ver `JusanteChartSeries`). O domínio Y da COTA é
 * esticado para incluir TODOS os limiares definidos, mesmo distantes da
 * linha (contexto), desenhados como anotações tracejadas — a 2ª série não
 * tem limiar, seu eixo só encaixa a própria série.
 */
export default function LevelChart({
  readings,
  thresholds,
  secondary,
  wide = false,
}: LevelChartProps) {
  const config = useMemo(() => {
    const points = readings
      .map((r) => ({ x: r.at.getTime(), y: r.value / 100 }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (points.length < 2) return null;

    const secondaryPoints = (secondary?.points ?? []).filter(
      (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
    );
    const hasSecondary = secondaryPoints.length > 0;
    const secondaryLabel = secondary?.label ?? "Jusante";
    const secondaryUnit = secondary?.unit ?? "m";

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
          label: "Cota",
          data: points,
          borderColor: COTA_COLOR,
          borderWidth: 2,
          fill: true,
          backgroundColor: "rgba(3,105,161,0.10)",
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: COTA_COLOR,
          pointHoverBorderColor: "#ffffff",
          tension: 0.25,
          yAxisID: "y",
        },
        ...(hasSecondary
          ? [
              {
                label: secondaryLabel,
                data: secondaryPoints,
                borderColor: SECONDARY_COLOR,
                borderWidth: 2,
                borderDash: [5, 3],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: SECONDARY_COLOR,
                pointHoverBorderColor: "#ffffff",
                tension: 0.25,
                yAxisID: "ySecondary",
              },
            ]
          : []),
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
            color: COTA_COLOR,
            font: { size: 10 },
            callback: (value) => Number(value).toFixed(2),
          },
        },
        // Eixo da 2ª série (2026-09-15) — PRÓPRIO, à direita, sem
        // compartilhar escala com a cota (pedido explícito do usuário:
        // "coloca essa serie em eixo oposto, nao compartilhe eixos"). Só
        // existe quando há dado secundário; `grid` desligado nele pra não
        // duplicar as linhas de fundo do eixo `y` (a grade principal já
        // basta como referência).
        ...(hasSecondary
          ? {
              ySecondary: {
                type: "linear" as const,
                position: "right" as const,
                grid: { display: false },
                ticks: {
                  color: SECONDARY_COLOR,
                  font: { size: 10 },
                  callback: (value: number | string) => Number(value).toFixed(2),
                },
              },
            }
          : {}),
      },
      plugins: {
        legend: {
          display: hasSecondary,
          position: "top" as const,
          align: "end" as const,
          labels: {
            boxWidth: 14,
            boxHeight: 2,
            font: { size: 10 },
            color: "#475569",
          },
        },
        tooltip: {
          displayColors: hasSecondary,
          callbacks: {
            title: (items: TooltipItem<"line">[]) =>
              fmtDateTime(Number(items[0]?.parsed.x)),
            label: (item: TooltipItem<"line">) => {
              if (!hasSecondary) return `${item.parsed.y.toFixed(3)} m`;
              const isSecondary = item.dataset.label === secondaryLabel;
              const unit = isSecondary ? secondaryUnit : "m";
              return `${item.dataset.label}: ${item.parsed.y.toFixed(isSecondary ? 2 : 3)} ${unit}`;
            },
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
  }, [readings, thresholds, secondary, wide]);

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
