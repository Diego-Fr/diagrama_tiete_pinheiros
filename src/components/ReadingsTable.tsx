import type { Reading } from "@/api/measurements";
import { formatFullDateTimeBR } from "@/lib/datetime";

interface ReadingsTableProps {
  readings: Reading[];
}

type Trend = "up" | "down" | "flat";

const TREND_GLYPH: Record<Trend, string> = { up: "↑", down: "↓", flat: "=" };

/** Leituras do posto (mais recente primeiro), formato alternativo ao gráfico. */
export default function ReadingsTable({ readings }: ReadingsTableProps) {
  if (readings.length === 0) {
    return <p className="level-chart__empty">Sem dados suficientes no período.</p>;
  }

  const rows = [...readings].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="readings-table-wrap">
      <table className="readings-table">
        <thead>
          <tr>
            <th>Data/hora</th>
            <th>Valor (m)</th>
            <th>Tend.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const previous = rows[i + 1]; // próxima no array = anterior no tempo
            const trend: Trend =
              !previous || r.value === previous.value
                ? "flat"
                : r.value > previous.value
                  ? "up"
                  : "down";
            return (
              <tr key={`${r.date}-${i}`}>
                <td>{formatFullDateTimeBR(r.at)}</td>
                <td className="readings-table__value">
                  {(r.value / 100).toFixed(3)}
                </td>
                <td className={`readings-table__trend readings-table__trend--${trend}`}>
                  {TREND_GLYPH[trend]}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
