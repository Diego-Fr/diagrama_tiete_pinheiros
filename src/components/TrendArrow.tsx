import { TREND_PATHS, type Trend } from "@/lib/trendIcons";

interface TrendArrowProps {
  trend: Trend;
  size?: number;
  className?: string;
}

/**
 * Seta de tendência (SVG) — mesmo desenho das caixas do mapa. A cor vem do
 * CSS de quem chama (`stroke="currentColor"`), então basta colorir o
 * elemento pai (ver `.station-sidebar__trend--*` / `.readings-table__trend--*`).
 */
export default function TrendArrow({ trend, size = 16, className }: TrendArrowProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={TREND_PATHS[trend]} />
    </svg>
  );
}
