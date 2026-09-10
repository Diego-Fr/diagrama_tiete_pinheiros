import { useEffect, useState } from "react";
import { fluviometricIds } from "@/data/stations";
import {
  MEASUREMENTS_REFRESH_MS,
  useMeasurements,
} from "@/hooks/useMeasurements";

/**
 * Barra no topo do mapa: representa o tempo até o próximo auto-refresh das
 * medições. Cheia logo após buscar; esvazia da esquerda (direita = 100%,
 * esquerda = 0%). `parameters` não recarrega — são valores estáticos.
 */
export default function RefreshBar() {
  const { dataUpdatedAt } = useMeasurements(fluviometricIds);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

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
