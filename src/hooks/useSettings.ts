import { useCallback, useEffect, useState } from "react";
import { BOX_FORMATS, BOX_SIZES, type BoxFormat, type BoxSize } from "@/lib/boxFormat";
import type { AppView } from "@/components/ViewSwitcher";
import { AVAILABLE_DIAGRAMS } from "@/config/diagrams";

export type BaseLayerId = "gray" | "satellite";
const BASE_LAYERS: BaseLayerId[] = ["gray", "satellite"];
const APP_VIEWS: AppView[] = ["map", "flow"];
const DIAGRAM_IDS = AVAILABLE_DIAGRAMS.map((d) => d.id);

/**
 * Configurações do MAPA e do DIAGRAMA são independentes (pedido do usuário,
 * 2026-09-13: "separar a configuração salva no localStorage do mapa da
 * configuração do diagrama... as coisas não se conversam direito") — cada
 * um tem seu próprio blob em localStorage, mudar o formato/tamanho da
 * caixa (ou a animação de vazão) numa view não afeta a outra. `baseLayer`
 * só existe no mapa (o diagrama não tem camada base/Leaflet).
 */
export interface MapSettings {
  boxFormat: BoxFormat;
  boxSize: BoxSize;
  baseLayer: BaseLayerId;
  riverFlowAnimation: boolean;
}
export interface FlowSettings {
  boxFormat: BoxFormat;
  boxSize: BoxSize;
  riverFlowAnimation: boolean;
}

const MAP_DEFAULTS: MapSettings = {
  boxFormat: "default",
  boxSize: "padrao",
  baseLayer: "gray",
  riverFlowAnimation: true,
};
const FLOW_DEFAULTS: FlowSettings = {
  boxFormat: "default",
  boxSize: "padrao",
  riverFlowAnimation: true,
};

const MAP_STORAGE_KEY = "diagrama-tiete:map-settings";
const FLOW_STORAGE_KEY = "diagrama-tiete:flow-settings";
const VIEW_STORAGE_KEY = "diagrama-tiete:view";
const DIAGRAM_STORAGE_KEY = "diagrama-tiete:diagram";

/** Só usado quando NENHUMA preferência de `view` foi salva ainda — mapa
 * geográfico não fica bom no celular (pedido do usuário, 2026-09-12), então
 * o primeiríssimo acesso (sem localStorage, sem query param) abre no
 * diagrama em telas estreitas. Mesmo breakpoint mobile (760px) do resto do
 * app. */
function defaultView(): AppView {
  if (typeof window === "undefined") return "map";
  return window.matchMedia("(max-width: 760px)").matches ? "flow" : "map";
}

function loadView(): AppView {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (raw == null) return defaultView();
    // `persist()` sempre grava com JSON.stringify (mesmo pra uma string
    // simples, vira `"flow"` com aspas literais) — tem que fazer o parse
    // simétrico aqui, senão a comparação abaixo nunca bate e a preferência
    // salva nunca é lida de volta (bug real encontrado em 2026-09-13: sem
    // isso, a view SEMPRE volta pro default de largura de tela a cada
    // reload, mesmo already tendo sido trocada e persistida).
    const parsed = JSON.parse(raw);
    return parsed === "map" || parsed === "flow" ? parsed : defaultView();
  } catch {
    return defaultView();
  }
}

/** Área de interesse/diagrama ativo — SEMPRE o Tietê/Pinheiros quando não
 * há nada salvo ainda (histórico: era o único diagrama até 2026-09-14). */
function defaultDiagramId(): string {
  return AVAILABLE_DIAGRAMS[0]?.id ?? "tiete-pinheiros";
}

function loadDiagramId(): string {
  try {
    const raw = localStorage.getItem(DIAGRAM_STORAGE_KEY);
    if (raw == null) return defaultDiagramId();
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" && DIAGRAM_IDS.includes(parsed)
      ? parsed
      : defaultDiagramId();
  } catch {
    return defaultDiagramId();
  }
}

function loadMapSettings(): MapSettings {
  try {
    const raw = localStorage.getItem(MAP_STORAGE_KEY);
    if (!raw) return MAP_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<MapSettings>;
    return {
      boxFormat: (BOX_FORMATS as string[]).includes(parsed.boxFormat as string)
        ? (parsed.boxFormat as BoxFormat)
        : MAP_DEFAULTS.boxFormat,
      boxSize: (BOX_SIZES as string[]).includes(parsed.boxSize as string)
        ? (parsed.boxSize as BoxSize)
        : MAP_DEFAULTS.boxSize,
      baseLayer: (BASE_LAYERS as string[]).includes(parsed.baseLayer as string)
        ? (parsed.baseLayer as BaseLayerId)
        : MAP_DEFAULTS.baseLayer,
      riverFlowAnimation:
        typeof parsed.riverFlowAnimation === "boolean"
          ? parsed.riverFlowAnimation
          : MAP_DEFAULTS.riverFlowAnimation,
    };
  } catch {
    return MAP_DEFAULTS;
  }
}

function loadFlowSettings(): FlowSettings {
  try {
    const raw = localStorage.getItem(FLOW_STORAGE_KEY);
    if (!raw) return FLOW_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<FlowSettings>;
    return {
      boxFormat: (BOX_FORMATS as string[]).includes(parsed.boxFormat as string)
        ? (parsed.boxFormat as BoxFormat)
        : FLOW_DEFAULTS.boxFormat,
      boxSize: (BOX_SIZES as string[]).includes(parsed.boxSize as string)
        ? (parsed.boxSize as BoxSize)
        : FLOW_DEFAULTS.boxSize,
      riverFlowAnimation:
        typeof parsed.riverFlowAnimation === "boolean"
          ? parsed.riverFlowAnimation
          : FLOW_DEFAULTS.riverFlowAnimation,
    };
  } catch {
    return FLOW_DEFAULTS;
  }
}

/**
 * Nomes dos query params (2026-09-13, pedido do usuário: "muitas
 * configurações, use nomes resumidos pra diminuir o tamanho da URL") — os
 * valores aceitos são os mesmos literais do tipo TypeScript de cada campo
 * (sem tradução/abreviação de valor, só a CHAVE é curta). Token de login
 * (`useAuth`) e posições arrastadas de posto (`useStationPositions`/
 * `useFlowStationPositions`) ficaram de FORA de propósito: o token é
 * credencial (nunca em URL) e as posições são um mapa arbitrário por
 * posto (não uma preferência compacta — não caberia bem num query param
 * nomeado).
 *
 * `bf`/`bs`/`rf` são AMBÍGUOS agora que mapa e diagrama têm configs
 * separadas — resolvidos contra a `view` (da própria URL, ou a já salva,
 * ou o default de mobile) ANTES de decidir se aplicam no `MapSettings` ou
 * no `FlowSettings`: `?vw=flow&bf=basico` seta o formato do DIAGRAMA, não
 * do mapa. `bl` (baseLayer) é sempre do mapa, não depende da view (só
 * mapa tem camada base). `dg` (área de interesse/diagrama) é independente
 * da view — troca o dataset de postos + pacote curado, ver `App.tsx`.
 */
const QUERY_KEYS = {
  boxFormat: "bf",
  boxSize: "bs",
  baseLayer: "bl",
  riverFlowAnimation: "rf",
  view: "vw",
  diagram: "dg",
} as const;

interface QueryOverrides {
  view?: AppView;
  diagramId?: string;
  map: Partial<MapSettings>;
  flow: Partial<FlowSettings>;
}

/**
 * Lê overrides válidos da URL atual (`?bf=...&bs=...&bl=...&rf=...&vw=...`)
 * — pra decidir o estado INICIAL (pedido do usuário: "consideradas no
 * primeiro carregamento da página"). Parâmetro ausente ou com valor fora
 * da lista aceita é ignorado silenciosamente (cai pro que já estava
 * salvo/default).
 *
 * `bf`/`bs`/`rf`/`bl` só valem pra ESSA visita (não sobrescrevem o
 * localStorage nem sincronizam de volta pra URL). **`vw` é diferente**:
 * pedido do usuário, 2026-09-13 — vira a preferência salva dali em diante
 * (ver o efeito em `useSettings`).
 *
 * Params aceitos:
 * - `vw` (view): "map" | "flow" — persiste, ao contrário dos demais
 * - `dg` (diagramId — área de interesse/bacia): um dos ids de
 *   `AVAILABLE_DIAGRAMS` (hoje: "tiete-pinheiros" | "ribeira-iguape") —
 *   persiste, mesmo padrão do `vw`
 * - `bf` (boxFormat, do mapa OU do diagrama conforme a `view` resolvida):
 *   "completo" | "default" | "basico" | "minimalista"
 * - `bs` (boxSize, idem): "padrao" | "grande" | "extra-grande" | "gigante"
 * - `bl` (baseLayer — sempre do mapa): "gray" | "satellite"
 * - `rf` (riverFlowAnimation, do mapa OU do diagrama conforme a `view`
 *   resolvida): "1" (true) | "0" (false)
 */
function loadQueryOverrides(resolvedView: AppView): QueryOverrides {
  const overrides: QueryOverrides = { map: {}, flow: {} };
  if (typeof window === "undefined") return overrides;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return overrides;
  }

  const vw = params.get(QUERY_KEYS.view);
  if (vw != null && (APP_VIEWS as string[]).includes(vw)) {
    overrides.view = vw as AppView;
  }

  const dg = params.get(QUERY_KEYS.diagram);
  if (dg != null && DIAGRAM_IDS.includes(dg)) {
    overrides.diagramId = dg;
  }

  const bl = params.get(QUERY_KEYS.baseLayer);
  if (bl != null && (BASE_LAYERS as string[]).includes(bl)) {
    overrides.map.baseLayer = bl as BaseLayerId;
  }

  const target = overrides.view ?? resolvedView;
  const bucket = target === "map" ? overrides.map : overrides.flow;

  const bf = params.get(QUERY_KEYS.boxFormat);
  if (bf != null && (BOX_FORMATS as string[]).includes(bf)) {
    bucket.boxFormat = bf as BoxFormat;
  }

  const bs = params.get(QUERY_KEYS.boxSize);
  if (bs != null && (BOX_SIZES as string[]).includes(bs)) {
    bucket.boxSize = bs as BoxSize;
  }

  const rf = params.get(QUERY_KEYS.riverFlowAnimation);
  if (rf === "1" || rf === "0") {
    bucket.riverFlowAnimation = rf === "1";
  }

  return overrides;
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage indisponível */
  }
}

/**
 * Configurações do usuário, em 4 pedaços independentes: `diagramId` (área
 * de interesse/bacia — Tietê ou Ribeira, decide qual dataset de postos e
 * qual pacote curado carregar, ver `App.tsx`), `view` (mapa ↔ diagrama —
 * decide qual dos outros dois está "ativo"), `mapSettings` e
 * `flowSettings` — cada blob salvo separado em localStorage, sem se
 * misturar. `diagramId` persiste sempre (mesmo padrão de `view` — pedido
 * do usuário, 2026-09-13, estendido pra área de interesse em 2026-09-14:
 * "essa alteração também deve ser salva no localStorage como preferência
 * do usuário"). Também trocável via query param `dg` (2026-09-15, mesmo
 * padrão do `vw` — ver `loadQueryOverrides`).
 */
export function useSettings() {
  const [diagramId, setDiagramIdState] = useState<string>(() => {
    const raw = loadDiagramId();
    const query = loadQueryOverrides(loadView());
    return query.diagramId ?? raw;
  });
  // `view` primeiro — os overrides de query de bf/bs/rf dependem de saber
  // qual view está ativa (pra decidir mapa ou diagrama).
  const [view, setViewState] = useState<AppView>(() => {
    const raw = loadView();
    const query = loadQueryOverrides(raw);
    return query.view ?? raw;
  });
  const [mapSettings, setMapSettings] = useState<MapSettings>(() => {
    const stored = loadMapSettings();
    const query = loadQueryOverrides(loadView());
    return { ...stored, ...query.map };
  });
  const [flowSettings, setFlowSettings] = useState<FlowSettings>(() => {
    const stored = loadFlowSettings();
    const query = loadQueryOverrides(loadView());
    return { ...stored, ...query.flow };
  });

  const setDiagramId = useCallback((next: string) => {
    setDiagramIdState(next);
    persist(DIAGRAM_STORAGE_KEY, next);
  }, []);

  const setView = useCallback((next: AppView) => {
    setViewState(next);
    persist(VIEW_STORAGE_KEY, next);
  }, []);

  const setMapSetting = useCallback(
    <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => {
      setMapSettings((prev) => {
        const next = { ...prev, [key]: value };
        persist(MAP_STORAGE_KEY, next);
        return next;
      });
    },
    [],
  );

  const setFlowSetting = useCallback(
    <K extends keyof FlowSettings>(key: K, value: FlowSettings[K]) => {
      setFlowSettings((prev) => {
        const next = { ...prev, [key]: value };
        persist(FLOW_STORAGE_KEY, next);
        return next;
      });
    },
    [],
  );

  // Se a URL tinha um `vw`/`dg` válido, essa escolha vira a preferência
  // salva dali em diante (diferente dos outros query params, que só valem
  // pra essa visita) — pedido do usuário, 2026-09-13 (vw) / 2026-09-15
  // (dg, mesmo padrão). Só roda 1x, no mount.
  useEffect(() => {
    const query = loadQueryOverrides(view);
    if (query.view) setView(query.view);
    if (query.diagramId) setDiagramId(query.diagramId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    diagramId,
    setDiagramId,
    view,
    setView,
    mapSettings,
    setMapSetting,
    flowSettings,
    setFlowSetting,
  };
}
