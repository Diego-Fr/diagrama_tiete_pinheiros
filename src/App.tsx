import { useCallback, useState } from "react";
import MapView from "@/components/MapView";
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

  return (
    <div className="app-shell">
      <h1 className="app-title">SIBH – Diagrama Tietê / Pinheiros</h1>
      <RefreshBar />
      <MapDateCard />

      <MapView
        selectedId={selectedId}
        boxFormat={settings.boxFormat}
        baseLayer={settings.baseLayer}
        riverFlow={settings.riverFlowAnimation}
        hoveredLevel={hoveredLevel}
        hiddenLevels={hiddenLevels}
        overrides={stationOverrides}
        recenterKey={recenterTick}
        onSelectStation={setSelectedId}
        onDragStation={setStationPosition}
        onMapClick={closeStation}
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
