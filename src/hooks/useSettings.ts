import { useCallback, useState } from "react";
import { BOX_FORMATS, type BoxFormat } from "@/lib/boxFormat";

export type BaseLayerId = "gray" | "satellite";
const BASE_LAYERS: BaseLayerId[] = ["gray", "satellite"];

/** Configurações do usuário persistidas em localStorage. */
export interface Settings {
  boxFormat: BoxFormat;
  baseLayer: BaseLayerId;
}

const DEFAULTS: Settings = { boxFormat: "default", baseLayer: "gray" };
const STORAGE_KEY = "diagrama-tiete:settings";

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      boxFormat: (BOX_FORMATS as string[]).includes(parsed.boxFormat as string)
        ? (parsed.boxFormat as BoxFormat)
        : DEFAULTS.boxFormat,
      baseLayer: (BASE_LAYERS as string[]).includes(parsed.baseLayer as string)
        ? (parsed.baseLayer as BaseLayerId)
        : DEFAULTS.baseLayer,
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Estado de configurações + persistência. Por ora só `boxFormat`; novas chaves
 * entram aqui e são salvas no mesmo blob JSON.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  const setSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* storage indisponível */
        }
        return next;
      });
    },
    [],
  );

  return { settings, setSetting };
}
