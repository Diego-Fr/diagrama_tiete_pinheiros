import { useEffect, useState } from "react";
import {
  MEASUREMENTS_REFRESH_MS,
  useMeasurements,
} from "@/hooks/useMeasurements";

interface RefreshBarProps {
  /** null = agora (ao vivo). Só faz sentido mostrar o contador nesse modo. */
  referenceDate: Date | null;
  /** Ids da área de interesse ativa (`REGION_STATION_IDS[region]`) — o
   * refresh é só dos postos realmente exibidos (2026-09-14, feature de
   * múltiplas áreas de interesse). */
  stationIds: number[];
}

/**
 * Barra no topo do mapa: representa o tempo até o próximo auto-refresh das
 * medições. Cheia logo após buscar; esvazia da direita p/ a esquerda.
 * `parameters` não recarrega — são valores estáticos. Some quando o usuário
 * está vendo uma data fixa no passado (não há "próximo refresh").
 */
export default function RefreshBar({ referenceDate, stationIds }: RefreshBarProps) {
  const isLive = referenceDate == null;
  const { dataUpdatedAt } = useMeasurements(stationIds, referenceDate);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  if (!isLive) return null;

  const elapsed = dataUpdatedAt ? now - dataUpdatedAt : 0;
  const fraction = dataUpdatedAt
    ? Math.max(0, Math.min(1, 1 - elapsed / MEASUREMENTS_REFRESH_MS))
    : 0;

  return (
    <div
      className="refresh-bar"
      role="progressbar"
      aria-label="Tempo até atualizar os dados"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fraction * 100)}
    >
      <div
        className="refresh-bar__fill"
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  );
}
