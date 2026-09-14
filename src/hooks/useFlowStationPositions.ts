import { useCallback, useState } from "react";

export interface FlowXY {
  x: number;
  y: number;
}

const STORAGE_KEY = "diagrama-tiete:flow-station-positions";

function load(): Record<number, FlowXY> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<number, FlowXY>) : {};
  } catch {
    return {};
  }
}

function persist(value: Record<number, FlowXY>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* modo privado / storage indisponível — segue sem persistir */
  }
}

/**
 * Guarda a posição arrastada de cada caixa no DIAGRAMA (por id do posto,
 * em coordenadas x/y do próprio esquema — não lat/lng), sobrepondo a
 * posição curada em `flowDiagram.ts`. Persiste num localStorage PRÓPRIO,
 * separado do `useStationPositions` do mapa (pedido do usuário,
 * 2026-09-13: mapa e diagrama não devem compartilhar customização — são
 * sistemas de coordenadas completamente diferentes, além de serem
 * conceitualmente independentes agora).
 */
export function useFlowStationPositions() {
  const [overrides, setOverrides] = useState<Record<number, FlowXY>>(load);

  const setPosition = useCallback((id: number, pos: FlowXY) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: pos };
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setOverrides({});
    persist({});
  }, []);

  return { overrides, setPosition, reset };
}
