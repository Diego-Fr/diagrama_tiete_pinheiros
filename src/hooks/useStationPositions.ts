import { useCallback, useState } from "react";

export type LatLngTuple = [number, number];

const STORAGE_KEY = "diagrama-tiete:station-positions";

function load(): Record<number, LatLngTuple> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<number, LatLngTuple>) : {};
  } catch {
    return {};
  }
}

function persist(value: Record<number, LatLngTuple>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* modo privado / storage indisponível — segue sem persistir */
  }
}

/**
 * Guarda a posição arrastada de cada caixa (por id do posto), sobrepondo a
 * coordenada original do JSON. Persiste em localStorage.
 */
export function useStationPositions() {
  const [overrides, setOverrides] = useState<Record<number, LatLngTuple>>(load);

  const setPosition = useCallback((id: number, pos: LatLngTuple) => {
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
