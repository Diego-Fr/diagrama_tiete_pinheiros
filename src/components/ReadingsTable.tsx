import type { Reading } from "@/api/measurements";
import TrendArrow from "@/components/TrendArrow";
import { formatFullDateTimeBR } from "@/lib/datetime";
import { formatFlow } from "@/lib/stationFormat";
import type { Trend } from "@/lib/trendIcons";

interface ReadingsTableProps {
  readings: Reading[];
}

/** Leituras do posto (mais recente primeiro), formato alternativo ao gráfico.
 * Coluna "Vazão (m³/s)" (2026-09-15) — só aparece quando ALGUMA leitura do
 * período tem `Reading.flow` preenchido (nem toda estação/leitura tem;
 * antes disso a regra do `read_value`/vazão era restrita à jusante de
 * reservatório — agora vale pra qualquer posto fluviométrico que a API
 * preencher, pedido do usuário: "qualquer posto flu, com read_value tem
 * vazao"). Linhas sem `flow` mostram "–" nessa coluna. */
export default function ReadingsTable({ readings }: ReadingsTableProps) {
  if (readings.length === 0) {
    return <p className="level-chart__empty">Sem dados suficientes no período.</p>;
  }

  const rows = [...readings].sort((a, b) => b.at.getTime() - a.at.getTime());
  const hasFlow = rows.some((r) => r.flow != null);

  return (
    <div className="readings-table-wrap">
      <table className="readings-table">
        <thead>
          <tr>
            <th>Data/hora</th>
            <th>Valor (m)</th>
            {hasFlow && <th>Vazão (m³/s)</th>}
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
                {hasFlow && (
                  <td className="readings-table__flow">
                    {r.flow != null ? formatFlow(r.flow) : "–"}
                  </td>
                )}
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
