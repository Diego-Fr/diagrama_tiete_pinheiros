import { useCallback, useState } from "react";
import MapView from "@/components/MapView";
import AppTitleMenu from "@/components/AppTitleMenu";
import BaseLayerSwitcher from "@/components/BaseLayerSwitcher";
import MapControls from "@/components/MapControls";
import MapDateCard from "@/components/MapDateCard";
import MapLegend from "@/components/MapLegend";
import RefreshBar from "@/components/RefreshBar";
import SettingsSidebar from "@/components/SettingsSidebar";
import StationSidebar from "@/components/StationSidebar";
import StationModal from "@/components/StationModal";
import type { LevelClass } from "@/lib/classification";
import { useSettings } from "@/hooks/useSettings";
import { useStationPositions } from "@/hooks/useStationPositions";

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recenterTick, setRecenterTick] = useState(0);
  const [mapClickTick, setMapClickTick] = useState(0);
  // null = agora (ao vivo); data fixa = janela de 6h congelada nela. Só o
  // mapa e a sidebar respeitam isso — o modal mantém sua própria lógica.
  const [referenceDate, setReferenceDate] = useState<Date | null>(null);
  const { settings, setSetting } = useSettings();
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

  // Clique em área vazia do mapa: fecha o sidebar da estação e sinaliza o
  // popover de data (que se fecha ao observar o closeSignal mudar).
  const handleMapClick = () => {
    closeStation();
    setMapClickTick((t) => t + 1);
  };

  return (
    <div className="app-shell">
      <AppTitleMenu />
      <RefreshBar referenceDate={referenceDate} />
      <MapDateCard
        referenceDate={referenceDate}
        onChange={setReferenceDate}
        closeSignal={mapClickTick}
      />

      <MapView
        selectedId={selectedId}
        boxFormat={settings.boxFormat}
        baseLayer={settings.baseLayer}
        riverFlow={settings.riverFlowAnimation}
        hoveredLevel={hoveredLevel}
        hiddenLevels={hiddenLevels}
        overrides={stationOverrides}
        referenceDate={referenceDate}
        recenterKey={recenterTick}
        onSelectStation={setSelectedId}
        onDragStation={setStationPosition}
        onMapClick={handleMapClick}
      />

      <MapControls
        onOpenSettings={() => setSettingsOpen(true)}
        onRecenter={() => setRecenterTick((t) => t + 1)}
        onResetPositions={resetStationPositions}
        hasCustomPositions={Object.keys(stationOverrides).length > 0}
      />
      <BaseLayerSwitcher
        value={settings.baseLayer}
        onChange={(id) => setSetting("baseLayer", id)}
      />
      <MapLegend
        hidden={hiddenLevels}
        onHover={setHoveredLevel}
        onToggle={toggleLevel}
      />

      <SettingsSidebar
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        format={settings.boxFormat}
        onFormatChange={(f) => setSetting("boxFormat", f)}
        riverFlow={settings.riverFlowAnimation}
        onRiverFlowChange={(v) => setSetting("riverFlowAnimation", v)}
      />
      <StationSidebar
        stationId={selectedId}
        referenceDate={referenceDate}
        onClose={closeStation}
        onExpand={() => setModalOpen(true)}
      />
      {modalOpen && selectedId != null && (
        <StationModal
          key={selectedId}
          stationId={selectedId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
