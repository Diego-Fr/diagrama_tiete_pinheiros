import { useCallback, useEffect, useState } from "react";
import { BOX_FORMATS, BOX_SIZES, type BoxFormat, type BoxSize } from "@/lib/boxFormat";
import type { AppView } from "@/components/ViewSwitcher";

export type BaseLayerId = "gray" | "satellite";
const BASE_LAYERS: BaseLayerId[] = ["gray", "satellite"];
const APP_VIEWS: AppView[] = ["map", "flow"];

/** Configurações do usuário persistidas em localStorage. */
export interface Settings {
  boxFormat: BoxFormat;
  /** Escala da caixa (tamanho) — independente do `boxFormat` (conteúdo). */
  boxSize: BoxSize;
  baseLayer: BaseLayerId;
  /** Anima o sentido da vazão do rio (faixa "correndo"). */
  riverFlowAnimation: boolean;
  /** Mapa geográfico ↔ diagrama de fluxo. Sem preferência salva ainda,
   * cai pro detector de mobile (ver `defaultView()`) em vez de um valor
   * fixo — por isso não entra em `DEFAULTS`. */
  view: AppView;
}

const DEFAULTS: Omit<Settings, "view"> = {
  boxFormat: "default",
  boxSize: "padrao",
  baseLayer: "gray",
  riverFlowAnimation: true,
};
const STORAGE_KEY = "diagrama-tiete:settings";

/** Só usado quando NENHUMA preferência de `view` foi salva ainda — mapa
 * geográfico não fica bom no celular (pedido do usuário, 2026-09-12), então
 * o primeiríssimo acesso (sem localStorage, sem query param) abre no
 * diagrama em telas estreitas. Mesmo breakpoint mobile (760px) do resto do
 * app. */
function defaultView(): AppView {
  if (typeof window === "undefined") return "map";
  return window.matchMedia("(max-width: 760px)").matches ? "flow" : "map";
}

/**
 * Nomes dos query params (2026-09-13, pedido do usuário: "muitas
 * configurações, use nomes resumidos pra diminuir o tamanho da URL") —
 * pras 5 configs salvas em localStorage via `useSettings`. Os valores
 * aceitos são os mesmos literais do tipo TypeScript de cada campo (sem
 * tradução/abreviação de valor, só a CHAVE é curta) — ver a lista completa
 * documentada no JSDoc de `loadFromQuery`. Token de login (`useAuth`) e
 * posições arrastadas de posto (`useStationPositions`) ficaram de FORA de
 * propósito: o token é credencial (nunca em URL) e as posições são um mapa
 * arbitrário por posto (não uma preferência compacta — não caberia bem num
 * query param nomeado).
 */
const QUERY_KEYS = {
  boxFormat: "bf",
  boxSize: "bs",
  baseLayer: "bl",
  riverFlowAnimation: "rf",
  view: "vw",
} as const;

/**
 * Lê overrides válidos da URL atual (`?bf=...&bs=...&bl=...&rf=...&vw=...`)
 * — pra decidir o estado INICIAL (pedido do usuário: "consideradas no
 * primeiro carregamento da página"). Parâmetro ausente ou com valor fora
 * da lista aceita é ignorado silenciosamente (cai pro que já estava
 * salvo/default).
 *
 * `bf`/`bs`/`bl`/`rf` só valem pra ESSA visita (não sobrescrevem o
 * localStorage nem sincronizam de volta pra URL). **`vw` é diferente**:
 * pedido do usuário, 2026-09-13 — vira a preferência salva dali em diante,
 * igual a se o usuário tivesse clicado no `ViewSwitcher` (ver o efeito em
 * `useSettings`).
 *
 * Params aceitos:
 * - `bf` (boxFormat): "completo" | "default" | "basico" | "minimalista"
 * - `bs` (boxSize): "padrao" | "grande" | "extra-grande" | "gigante"
 * - `bl` (baseLayer): "gray" | "satellite"
 * - `rf` (riverFlowAnimation): "1" (true) | "0" (false)
 * - `vw` (view): "map" | "flow" — persiste, ao contrário dos outros 4
 */
function loadFromQuery(): Partial<Settings> {
  if (typeof window === "undefined") return {};
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return {};
  }

  const overrides: Partial<Settings> = {};

  const bf = params.get(QUERY_KEYS.boxFormat);
  if (bf != null && (BOX_FORMATS as string[]).includes(bf)) {
    overrides.boxFormat = bf as BoxFormat;
  }

  const bs = params.get(QUERY_KEYS.boxSize);
  if (bs != null && (BOX_SIZES as string[]).includes(bs)) {
    overrides.boxSize = bs as BoxSize;
  }

  const bl = params.get(QUERY_KEYS.baseLayer);
  if (bl != null && (BASE_LAYERS as string[]).includes(bl)) {
    overrides.baseLayer = bl as BaseLayerId;
  }

  const rf = params.get(QUERY_KEYS.riverFlowAnimation);
  if (rf === "1" || rf === "0") {
    overrides.riverFlowAnimation = rf === "1";
  }

  const vw = params.get(QUERY_KEYS.view);
  if (vw != null && (APP_VIEWS as string[]).includes(vw)) {
    overrides.view = vw as AppView;
  }

  return overrides;
}

function loadFromStorage(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, view: defaultView() };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      boxFormat: (BOX_FORMATS as string[]).includes(parsed.boxFormat as string)
        ? (parsed.boxFormat as BoxFormat)
        : DEFAULTS.boxFormat,
      boxSize: (BOX_SIZES as string[]).includes(parsed.boxSize as string)
        ? (parsed.boxSize as BoxSize)
        : DEFAULTS.boxSize,
      baseLayer: (BASE_LAYERS as string[]).includes(parsed.baseLayer as string)
        ? (parsed.baseLayer as BaseLayerId)
        : DEFAULTS.baseLayer,
      riverFlowAnimation:
        typeof parsed.riverFlowAnimation === "boolean"
          ? parsed.riverFlowAnimation
          : DEFAULTS.riverFlowAnimation,
      view: (APP_VIEWS as string[]).includes(parsed.view as string)
        ? (parsed.view as AppView)
        : defaultView(),
    };
  } catch {
    return { ...DEFAULTS, view: defaultView() };
  }
}

/** localStorage é a base; query params (se presentes e válidos) vencem —
 * pelo menos no carregamento inicial (`vw` também fica salvo depois, ver
 * `useSettings`). */
function load(): Settings {
  return { ...loadFromStorage(), ...loadFromQuery() };
}

function persist(next: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage indisponível */
  }
}

/**
 * Estado de configurações + persistência. Todas as chaves entram aqui e
 * são salvas no mesmo blob JSON em localStorage.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  const setSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        persist(next);
        return next;
      });
    },
    [],
  );

  // Se a URL tinha um `vw` válido, essa escolha vira a preferência salva
  // dali em diante (diferente dos outros 4 query params, que só valem pra
  // essa visita) — pedido do usuário, 2026-09-13. Só roda 1x, no mount.
  useEffect(() => {
    const queryView = loadFromQuery().view;
    if (queryView) setSetting("view", queryView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { settings, setSetting };
}
