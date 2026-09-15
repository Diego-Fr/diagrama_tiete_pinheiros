import { useCallback, useRef, useState, type CSSProperties } from "react";
import MapView from "@/components/MapView";
import FlowView from "@/components/FlowView";
import AppNavbar from "@/components/AppNavbar";
import AppTitleMenu from "@/components/AppTitleMenu";
import AgencyLogo from "@/components/AgencyLogo";
import BaseLayerSwitcher from "@/components/BaseLayerSwitcher";
import MapControls from "@/components/MapControls";
import MapDateCard from "@/components/MapDateCard";
import MapLegend from "@/components/MapLegend";
import RefreshBar from "@/components/RefreshBar";
import SettingsSidebar from "@/components/SettingsSidebar";
import StationSidebar from "@/components/StationSidebar";
import StationModal from "@/components/StationModal";
import BarrageSidebar from "@/components/BarrageSidebar";
import ViewSwitcher from "@/components/ViewSwitcher";
import { AVAILABLE_DIAGRAMS } from "@/config/diagrams";
import { FLOW_DIAGRAMS } from "@/config/flowDiagrams";
import { barrages as TIETE_BARRAGES } from "@/data/barrages";
import { REGION_STATIONS, REGION_STATION_IDS } from "@/data/stations";
import { BOX_SIZE_SCALE } from "@/lib/boxFormat";
import type { LevelClass } from "@/lib/classification";
import { formatFileStampBR } from "@/lib/datetime";
import { downloadElementAsPng } from "@/lib/mapSnapshot";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useFlowStationPositions } from "@/hooks/useFlowStationPositions";
import { useStationPositions } from "@/hooks/useStationPositions";

/** Sem barragem monitorada conhecida fora do Tietê/Pinheiros — array vazio
 * pras demais bacias (2026-09-14, feature de múltiplas áreas de interesse). */
const NO_BARRAGES: typeof TIETE_BARRAGES = [];

/** Espera 2 frames — deixa o React aplicar (e o navegador pintar) os ajustes
 * de "modo captura" (esconder controles, congelar a data) antes do print. */
function waitTwoFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export default function App() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Barragem selecionada no fluxo (Barragem Móvel/da Penha) — mutuamente
  // exclusiva com `selectedId`: só uma sidebar aberta por vez.
  const [selectedBarrageId, setSelectedBarrageId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recenterTick, setRecenterTick] = useState(0);
  const [mapClickTick, setMapClickTick] = useState(0);
  // Print do mapa (botão de câmera): enquanto true, esconde controles de UI
  // (zoom/config/base layer) e trava a animação dos rios via CSS/props —
  // ver `.app-shell--capturing` e o `riverFlow` repassado ao MapView.
  const [capturing, setCapturing] = useState(false);
  // "AGORA" não faz sentido numa imagem estática — durante o print, mostra a
  // data/hora reais resolvidas (a de referência, se houver, senão o instante
  // do clique) no lugar do rótulo relativo.
  const [captureAsOf, setCaptureAsOf] = useState<Date | null>(null);
  // null = agora (ao vivo); data fixa = janela de 6h congelada nela. Só o
  // mapa e a sidebar respeitam isso — o modal mantém sua própria lógica.
  const [referenceDate, setReferenceDate] = useState<Date | null>(null);
  const {
    diagramId,
    setDiagramId,
    view,
    setView,
    mapSettings,
    setMapSetting,
    flowSettings,
    setFlowSetting,
  } = useSettings();
  // Área de interesse ativa (2026-09-14) — o diagrama escolhido decide a
  // bacia (`region`), que por sua vez decide qual dataset de postos
  // (`REGION_STATIONS`) e qual pacote curado (`FLOW_DIAGRAMS`) usar. Sem
  // barragem monitorada fora do Tietê/Pinheiros ainda.
  const activeDiagram =
    AVAILABLE_DIAGRAMS.find((d) => d.id === diagramId) ?? AVAILABLE_DIAGRAMS[0]!;
  const region = activeDiagram.region;
  const activeStations = REGION_STATIONS[region];
  const activeStationIds = REGION_STATION_IDS[region];
  const activeFlowDiagram = FLOW_DIAGRAMS[region];
  const activeBarrages = region === "tiete" ? TIETE_BARRAGES : NO_BARRAGES;
  // Sessão única (não chamar `useAuth` de novo em outro componente — ver
  // comentário no próprio hook) — repassada pra navbar (mostrar "Bem-vindo")
  // e pra sidebar da barragem (autorizar toggle das comportas).
  const auth = useAuth();
  const {
    overrides: stationOverrides,
    setPosition: setStationPosition,
    reset: resetStationPositions,
  } = useStationPositions();
  // Posições arrastadas no DIAGRAMA — storage próprio, separado do mapa
  // (pedido do usuário, 2026-09-13: mapa e diagrama não compartilham
  // customização, são sistemas de coordenadas diferentes).
  const {
    overrides: flowStationOverrides,
    setPosition: setFlowStationPosition,
    reset: resetFlowStationPositions,
  } = useFlowStationPositions();

  // Legenda interativa
  const [hoveredLevel, setHoveredLevel] = useState<LevelClass | null>(null);
  const [hiddenLevels, setHiddenLevels] = useState<Set<LevelClass>>(
    () => new Set(),
  );
  const toggleLevel = useCallback((level: LevelClass) => {
    setHiddenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  const closeStation = () => {
    setModalOpen(false);
    setSelectedId(null);
  };
  const closeBarrage = () => setSelectedBarrageId(null);
  const closeSelections = () => {
    closeStation();
    closeBarrage();
  };

  // Seleção de posto e de barragem são mutuamente exclusivas — só uma
  // sidebar por vez.
  const handleSelectStation = (id: number) => {
    closeBarrage();
    setSelectedId(id);
  };
  const handleSelectBarrage = (id: string) => {
    closeStation();
    setSelectedBarrageId(id);
  };

  // Clique em área vazia do mapa/diagrama: fecha as sidebars (posto/barragem
  // E configurações — pedido do usuário, 2026-09-13) e sinaliza o popover de
  // data (que se fecha ao observar o closeSignal mudar).
  const handleMapClick = () => {
    closeSelections();
    setSettingsOpen(false);
    setMapClickTick((t) => t + 1);
  };

  const handleCapture = useCallback(async () => {
    if (capturing || !shellRef.current) return;
    const asOf = referenceDate ?? new Date();
    setCaptureAsOf(asOf);
    setCapturing(true);
    try {
      // deixa o React re-renderizar sem os controles/animação antes do print
      await waitTwoFrames();
      await downloadElementAsPng(
        shellRef.current,
        `sibh-tiete-pinheiros-${formatFileStampBR(asOf)}.png`,
      );
    } catch (err) {
      console.error("Falha ao gerar a imagem do mapa:", err);
    } finally {
      setCapturing(false);
      setCaptureAsOf(null);
    }
  }, [capturing, referenceDate]);

  // Configurações da view ATIVA (mapa/diagrama têm blobs independentes —
  // ver `useSettings`) — cada componente abaixo lê só do seu próprio lado.
  const activeSettings = view === "map" ? mapSettings : flowSettings;
  // Congela a animação de vazão durante o print — vale pro mapa e pro fluxo.
  const effectiveRiverFlow = capturing ? false : activeSettings.riverFlowAnimation;

  return (
    <div
      className="app-root"
      style={{ "--box-scale": BOX_SIZE_SCALE[activeSettings.boxSize] } as CSSProperties}
    >
      <AppNavbar auth={auth} />
      <div
        className={`app-shell${capturing ? " app-shell--capturing" : ""}`}
        ref={shellRef}
      >
        <div className="top-bar-left">
          <AppTitleMenu
            value={diagramId}
            onChange={(id) => {
              closeSelections();
              setDiagramId(id);
            }}
          />
          <ViewSwitcher
            value={view}
            onChange={(v) => {
              closeSelections();
              setView(v);
            }}
          />
        </div>

        {/* Seletor de data e barra de auto-refresh — comuns às duas visões
            (mapa e fluxo usam a mesma `referenceDate`, pedido do usuário:
            "os dois contextos até podem usar a mesma data, não vejo
            problema"; a barra também foi pedida explicitamente pro
            fluxograma). */}
        <MapDateCard
          referenceDate={referenceDate}
          onChange={setReferenceDate}
          closeSignal={mapClickTick}
          captureAsOf={captureAsOf}
        />
        <RefreshBar referenceDate={referenceDate} stationIds={activeStationIds} />

        {view === "flow" ? (
          <FlowView
            region={region}
            stations={activeStations}
            stationIds={activeStationIds}
            flowDiagram={activeFlowDiagram}
            barrages={activeBarrages}
            referenceDate={referenceDate}
            boxFormat={flowSettings.boxFormat}
            riverFlow={effectiveRiverFlow}
            selectedId={selectedId}
            onSelectStation={handleSelectStation}
            selectedBarrageId={selectedBarrageId}
            onSelectBarrage={handleSelectBarrage}
            hoveredLevel={hoveredLevel}
            hiddenLevels={hiddenLevels}
            hideNoData={capturing}
            capturing={capturing}
            overrides={flowStationOverrides}
            onDragStation={setFlowStationPosition}
            onPaneClick={handleMapClick}
          />
        ) : (
          <>
            <MapView
              region={region}
              stations={activeStations}
              selectedId={selectedId}
              boxFormat={mapSettings.boxFormat}
              boxSize={mapSettings.boxSize}
              baseLayer={mapSettings.baseLayer}
              riverFlow={effectiveRiverFlow}
              hoveredLevel={hoveredLevel}
              hiddenLevels={hiddenLevels}
              hideNoData={capturing}
              overrides={stationOverrides}
              referenceDate={referenceDate}
              recenterKey={recenterTick}
              onSelectStation={handleSelectStation}
              onDragStation={setStationPosition}
              onMapClick={handleMapClick}
            />

            <BaseLayerSwitcher
              value={mapSettings.baseLayer}
              onChange={(id) => setMapSetting("baseLayer", id)}
            />
            <AgencyLogo />
          </>
        )}

        <MapLegend
          hidden={hiddenLevels}
          onHover={setHoveredLevel}
          onToggle={toggleLevel}
          showBarrageItem={view === "flow" && activeBarrages.length > 0}
        />

        <MapControls
          onOpenSettings={() => setSettingsOpen(true)}
          onRecenter={view === "map" ? () => setRecenterTick((t) => t + 1) : undefined}
          onResetPositions={view === "map" ? resetStationPositions : resetFlowStationPositions}
          hasCustomPositions={
            view === "map"
              ? Object.keys(stationOverrides).length > 0
              : Object.keys(flowStationOverrides).length > 0
          }
          onCapture={handleCapture}
          capturing={capturing}
        />
        <SettingsSidebar
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          format={activeSettings.boxFormat}
          onFormatChange={(f) =>
            view === "map" ? setMapSetting("boxFormat", f) : setFlowSetting("boxFormat", f)
          }
          size={activeSettings.boxSize}
          onSizeChange={(s) =>
            view === "map" ? setMapSetting("boxSize", s) : setFlowSetting("boxSize", s)
          }
          riverFlow={activeSettings.riverFlowAnimation}
          onRiverFlowChange={(v) =>
            view === "map"
              ? setMapSetting("riverFlowAnimation", v)
              : setFlowSetting("riverFlowAnimation", v)
          }
        />
        <StationSidebar
          region={region}
          stations={activeStations}
          stationIds={activeStationIds}
          stationId={selectedId}
          referenceDate={referenceDate}
          onClose={closeStation}
          onExpand={() => setModalOpen(true)}
        />
        <BarrageSidebar barrageId={selectedBarrageId} onClose={closeBarrage} auth={auth} />
        {modalOpen && selectedId != null && (
          <StationModal
            key={selectedId}
            stations={activeStations}
            stationIds={activeStationIds}
            stationId={selectedId}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
