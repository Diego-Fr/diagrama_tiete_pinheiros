import { useCallback, useRef, useState, type CSSProperties } from "react";
import MapView from "@/components/MapView";
import FlowView from "@/components/FlowView";
import AppNavbar from "@/components/AppNavbar";
import AppTitleMenu from "@/components/AppTitleMenu";
import BaseLayerSwitcher from "@/components/BaseLayerSwitcher";
import MapControls from "@/components/MapControls";
import MapDateCard from "@/components/MapDateCard";
import MapLegend from "@/components/MapLegend";
import RefreshBar from "@/components/RefreshBar";
import SettingsSidebar from "@/components/SettingsSidebar";
import StationSidebar from "@/components/StationSidebar";
import StationModal from "@/components/StationModal";
import BarrageSidebar from "@/components/BarrageSidebar";
import ViewSwitcher, { type AppView } from "@/components/ViewSwitcher";
import { BOX_SIZE_SCALE } from "@/lib/boxFormat";
import type { LevelClass } from "@/lib/classification";
import { formatFileStampBR } from "@/lib/datetime";
import { downloadElementAsPng } from "@/lib/mapSnapshot";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useStationPositions } from "@/hooks/useStationPositions";

/** Espera 2 frames — deixa o React aplicar (e o navegador pintar) os ajustes
 * de "modo captura" (esconder controles, congelar a data) antes do print. */
function waitTwoFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export default function App() {
  const shellRef = useRef<HTMLDivElement>(null);
  // Mapa geográfico (Leaflet) ↔ diagrama de fluxo (React Flow) — trocado
  // pelo ViewSwitcher ao lado do título.
  const [view, setView] = useState<AppView>("map");
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
  const { settings, setSetting } = useSettings();
  // Sessão única (não chamar `useAuth` de novo em outro componente — ver
  // comentário no próprio hook) — repassada pra navbar (mostrar "Bem-vindo")
  // e pra sidebar da barragem (autorizar toggle das comportas).
  const auth = useAuth();
  const {
    overrides: stationOverrides,
    setPosition: setStationPosition,
    reset: resetStationPositions,
  } = useStationPositions();

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

  // Clique em área vazia do mapa: fecha as sidebars e sinaliza o popover de
  // data (que se fecha ao observar o closeSignal mudar).
  const handleMapClick = () => {
    closeSelections();
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

  // Congela a animação de vazão durante o print — vale pro mapa e pro fluxo.
  const effectiveRiverFlow = capturing ? false : settings.riverFlowAnimation;

  return (
    <div
      className="app-root"
      style={{ "--box-scale": BOX_SIZE_SCALE[settings.boxSize] } as CSSProperties}
    >
      <AppNavbar auth={auth} />
      <div
        className={`app-shell${capturing ? " app-shell--capturing" : ""}`}
        ref={shellRef}
      >
        <div className="top-bar-left">
          <AppTitleMenu />
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
        <RefreshBar referenceDate={referenceDate} />

        {view === "flow" ? (
          <FlowView
            referenceDate={referenceDate}
            boxFormat={settings.boxFormat}
            riverFlow={effectiveRiverFlow}
            selectedId={selectedId}
            onSelectStation={handleSelectStation}
            selectedBarrageId={selectedBarrageId}
            onSelectBarrage={handleSelectBarrage}
            hoveredLevel={hoveredLevel}
            hiddenLevels={hiddenLevels}
            hideNoData={capturing}
            onPaneClick={handleMapClick}
          />
        ) : (
          <>
            <MapView
              selectedId={selectedId}
              boxFormat={settings.boxFormat}
              boxSize={settings.boxSize}
              baseLayer={settings.baseLayer}
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
              value={settings.baseLayer}
              onChange={(id) => setSetting("baseLayer", id)}
            />
          </>
        )}

        <MapLegend
          hidden={hiddenLevels}
          onHover={setHoveredLevel}
          onToggle={toggleLevel}
          showBarrageItem={view === "flow"}
        />

        <MapControls
          onOpenSettings={() => setSettingsOpen(true)}
          onRecenter={view === "map" ? () => setRecenterTick((t) => t + 1) : undefined}
          onResetPositions={view === "map" ? resetStationPositions : undefined}
          hasCustomPositions={Object.keys(stationOverrides).length > 0}
          onCapture={handleCapture}
          capturing={capturing}
        />
        <SettingsSidebar
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          format={settings.boxFormat}
          onFormatChange={(f) => setSetting("boxFormat", f)}
          size={settings.boxSize}
          onSizeChange={(s) => setSetting("boxSize", s)}
          riverFlow={settings.riverFlowAnimation}
          onRiverFlowChange={(v) => setSetting("riverFlowAnimation", v)}
        />
        <StationSidebar
          stationId={selectedId}
          referenceDate={referenceDate}
          onClose={closeStation}
          onExpand={() => setModalOpen(true)}
        />
        <BarrageSidebar barrageId={selectedBarrageId} onClose={closeBarrage} auth={auth} />
        {modalOpen && selectedId != null && (
          <StationModal
            key={selectedId}
            stationId={selectedId}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
