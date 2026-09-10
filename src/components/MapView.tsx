import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvent } from "react-leaflet";
import L from "leaflet";
import StationsLayer from "@/components/StationsLayer";
import type { BoxFormat } from "@/lib/boxFormat";
import type { LevelClass } from "@/lib/classification";
import type { BaseLayerId } from "@/hooks/useSettings";
import { fluviometricStations } from "@/data/stations";
import {
  BASEMAP_LABELS_URL,
  BASEMAP_MAX_NATIVE_ZOOM,
  BASEMAP_TILE_URL,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  SATELLITE_LABELS_URL,
  SATELLITE_TILE_URL,
  SP_STATE_BOUNDS,
} from "@/config/map";

/** Enquadramento inicial: caixa que contém todas as estações fluviométricas. */
const STATIONS_BOUNDS = L.latLngBounds(
  fluviometricStations.map((s) => [s.lat, s.lng] as [number, number]),
);

interface MapViewProps {
  selectedId: number | null;
  boxFormat: BoxFormat;
  baseLayer: BaseLayerId;
  hoveredLevel: LevelClass | null;
  hiddenLevels: Set<LevelClass>;
  onSelectStation: (stationId: number) => void;
  /** Clique em área vazia do mapa. */
  onMapClick: () => void;
}

/** Dispara `onClick` num clique do mapa (área sem marcador). */
function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvent("click", () => onClick());
  return null;
}

/** Enquadra a região das estações assim que o mapa monta. */
function FitToStations() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(STATIONS_BOUNDS, { padding: [50, 50], maxZoom: 13 });
  }, [map]);
  return null;
}

/**
 * Mapa base em tela cheia (Esri World Light Gray Canvas — cinza claro estilo
 * Positron, gratuito e sem API key). Cliques em marcadores abrem a sidebar;
 * clique no mapa vazio fecha.
 */
export default function MapView({
  selectedId,
  boxFormat,
  baseLayer,
  hoveredLevel,
  hiddenLevels,
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
      attributionControl={false}
    >
      {baseLayer === "satellite" ? (
        <>
          <TileLayer key="sat" url={SATELLITE_TILE_URL} maxZoom={MAX_ZOOM} />
          <TileLayer
            key="sat-labels"
            url={SATELLITE_LABELS_URL}
            maxZoom={MAX_ZOOM}
          />
        </>
      ) : (
        <>
          <TileLayer
            key="gray"
            url={BASEMAP_TILE_URL}
            maxZoom={MAX_ZOOM}
            maxNativeZoom={BASEMAP_MAX_NATIVE_ZOOM}
          />
          <TileLayer
            key="gray-labels"
            url={BASEMAP_LABELS_URL}
            maxZoom={MAX_ZOOM}
            maxNativeZoom={BASEMAP_MAX_NATIVE_ZOOM}
          />
        </>
      )}
      <FitToStations />
      <StationsLayer
        selectedId={selectedId}
        boxFormat={boxFormat}
        hoveredLevel={hoveredLevel}
        hiddenLevels={hiddenLevels}
        onSelectStation={onSelectStation}
      />
      <MapClickHandler onClick={onMapClick} />
    </MapContainer>
  );
}
