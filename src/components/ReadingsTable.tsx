import type { Reading } from "@/api/measurements";
import TrendArrow from "@/components/TrendArrow";
import { formatFullDateTimeBR } from "@/lib/datetime";
import type { Trend } from "@/lib/trendIcons";

interface ReadingsTableProps {
  readings: Reading[];
}

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
                  <TrendArrow trend={trend} size={15} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
