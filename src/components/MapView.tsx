import { MapContainer, TileLayer, useMapEvent } from "react-leaflet";
import StationsLayer from "@/components/StationsLayer";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  SP_STATE_BOUNDS,
} from "@/config/map";

interface MapViewProps {
  selectedId: number | null;
  onSelectStation: (stationId: number) => void;
  /** Clique em área vazia do mapa. */
  onMapClick: () => void;
}

/** Dispara `onClick` num clique do mapa (área sem marcador). */
function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvent("click", () => onClick());
  return null;
}

/**
 * Mapa base em tela cheia (OpenStreetMap), centrado no estado de São Paulo.
 * Cliques em marcadores abrem a sidebar; clique no mapa vazio fecha.
 */
export default function MapView({
  selectedId,
  onSelectStation,
  onMapClick,
}: MapViewProps) {
  return (
    <MapContainer
      className="map-root"
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      maxBounds={SP_STATE_BOUNDS}
      maxBoundsViscosity={0.75}
      zoomControl
    >
      <TileLayer
        url={OSM_TILE_URL}
        attribution={OSM_ATTRIBUTION}
        maxZoom={MAX_ZOOM}
      />
      <StationsLayer
        selectedId={selectedId}
        onSelectStation={onSelectStation}
      />
      <MapClickHandler onClick={onMapClick} />
    </MapContainer>
  );
}
