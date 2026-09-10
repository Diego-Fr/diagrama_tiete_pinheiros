import { useState } from "react";
import MapView from "@/components/MapView";
import StationSidebar from "@/components/StationSidebar";
import StationModal from "@/components/StationModal";

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const closeAll = () => {
    setModalOpen(false);
    setSelectedId(null);
  };

  return (
    <div className="app-shell">
      <h1 className="app-title">SIBH – Diagrama Tietê / Pinheiros</h1>
      <MapView
        selectedId={selectedId}
        onSelectStation={setSelectedId}
        onMapClick={closeAll}
      />
      <StationSidebar
        stationId={selectedId}
        onClose={closeAll}
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
