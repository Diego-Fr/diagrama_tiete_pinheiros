import { useCallback, useState } from "react";
import MapView from "@/components/MapView";
import BaseLayerSwitcher from "@/components/BaseLayerSwitcher";
import MapDateCard from "@/components/MapDateCard";
import MapLegend from "@/components/MapLegend";
import RefreshBar from "@/components/RefreshBar";
import SettingsSidebar from "@/components/SettingsSidebar";
import StationSidebar from "@/components/StationSidebar";
import StationModal from "@/components/StationModal";
import type { LevelClass } from "@/lib/classification";
import { useSettings } from "@/hooks/useSettings";

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, setSetting } = useSettings();

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
      <MapDateCard onOpenSettings={() => setSettingsOpen(true)} />

      <MapView
        selectedId={selectedId}
        boxFormat={settings.boxFormat}
        baseLayer={settings.baseLayer}
        hoveredLevel={hoveredLevel}
        hiddenLevels={hiddenLevels}
        onSelectStation={setSelectedId}
        onMapClick={closeStation}
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
