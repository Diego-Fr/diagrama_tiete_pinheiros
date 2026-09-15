import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap, useMapEvent } from "react-leaflet";
import L from "leaflet";
import RiversLayer from "@/components/RiversLayer";
import StationsLayer from "@/components/StationsLayer";
import type { BoxFormat, BoxSize } from "@/lib/boxFormat";
import type { LevelClass } from "@/lib/classification";
import type { BaseLayerId } from "@/hooks/useSettings";
import type { LatLngTuple } from "@/hooks/useStationPositions";
import type { Region, StationPoint } from "@/types/station";
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

interface MapViewProps {
  /** Área de interesse ativa — só controla se o `RiversLayer` (WFS só tem
   * geometria do Tietê/Pinheiros, ver `config/rivers.ts`) entra ou não
   * (2026-09-14). Os postos já vêm prontos via `stations`. */
  region: Region;
  /** Postos da área de interesse ativa (`REGION_STATIONS[region]`). */
  stations: StationPoint[];
  selectedId: number | null;
  boxFormat: BoxFormat;
  boxSize: BoxSize;
  baseLayer: BaseLayerId;
  riverFlow: boolean;
  hoveredLevel: LevelClass | null;
  hiddenLevels: Set<LevelClass>;
  /** Esconde caixas sem leitura na janela — só durante o print. */
  hideNoData: boolean;
  /** Posições ajustadas manualmente (arrastadas) — vencem o layout automático. */
  overrides: Record<number, LatLngTuple>;
  /** null = agora (ao vivo); data fixa = janela de 6h congelada nela. */
  referenceDate: Date | null;
  /** Muda (incrementa) para forçar um novo fitBounds — botão "centralizar". */
  recenterKey: number;
  onSelectStation: (stationId: number) => void;
  /** Usuário soltou uma caixa numa nova posição — persistir. */
  onDragStation: (stationId: number, pos: LatLngTuple) => void;
  /** Clique em área vazia do mapa. */
  onMapClick: () => void;
}

/** Dispara `onClick` num clique do mapa (área sem marcador). */
function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvent("click", () => onClick());
  return null;
}

/**
 * Enquadra a região das estações no mount e sempre que `recenterKey` OU as
 * `bounds` mudarem (2026-09-14: `bounds` agora depende da área de interesse
 * ativa — sem isso, trocar de bacia manteria o enquadramento antigo até o
 * usuário clicar "centralizar" à mão).
 */
function FitToStations({
  bounds,
  recenterKey,
}: {
  bounds: L.LatLngBounds;
  recenterKey: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [10, 10], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, recenterKey, bounds]);
  return null;
}

/**
 * Mapa base em tela cheia (Esri World Light Gray Canvas — cinza claro estilo
 * Positron, gratuito e sem API key). Cliques em marcadores abrem a sidebar;
 * clique no mapa vazio fecha.
 */
export default function MapView({
  region,
  stations,
  selectedId,
  boxFormat,
  boxSize,
  baseLayer,
  riverFlow,
  hoveredLevel,
  hiddenLevels,
  hideNoData,
  overrides,
  referenceDate,
  recenterKey,
  onSelectStation,
  onDragStation,
  onMapClick,
}: MapViewProps) {
  // Enquadramento inicial: caixa que contém as estações da área de
  // interesse ATIVA (2026-09-14) — `stations` é uma referência estável por
  // região (`REGION_STATIONS`), então isso só recalcula ao trocar de bacia.
  const bounds = useMemo(
    () => L.latLngBounds(stations.map((s) => [s.lat, s.lng] as [number, number])),
    [stations],
  );

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
      {/* crossOrigin: Esri manda Access-Control-Allow-Origin: * — habilitar
          deixa o print do mapa (html-to-image) embutir os tiles sem "sujar"
          o canvas. */}
      {baseLayer === "satellite" ? (
        <>
          <TileLayer
            key="sat"
            url={SATELLITE_TILE_URL}
            maxZoom={MAX_ZOOM}
            crossOrigin="anonymous"
          />
          <TileLayer
            key="sat-labels"
            url={SATELLITE_LABELS_URL}
            maxZoom={MAX_ZOOM}
            crossOrigin="anonymous"
          />
        </>
      ) : (
        <>
          <TileLayer
            key="gray"
            url={BASEMAP_TILE_URL}
            maxZoom={MAX_ZOOM}
            maxNativeZoom={BASEMAP_MAX_NATIVE_ZOOM}
            crossOrigin="anonymous"
          />
          <TileLayer
            key="gray-labels"
            url={BASEMAP_LABELS_URL}
            maxZoom={MAX_ZOOM}
            maxNativeZoom={BASEMAP_MAX_NATIVE_ZOOM}
            crossOrigin="anonymous"
          />
        </>
      )}
      <FitToStations bounds={bounds} recenterKey={recenterKey} />
      {/* WFS de rios só tem geometria do Tietê/Pinheiros (`config/rivers.ts`)
          — sem camada equivalente pro Ribeira ainda, então some nessa
          região em vez de tentar buscar algo que não existe. */}
      {region === "tiete" && <RiversLayer flowAnimation={riverFlow} />}
      <StationsLayer
        stations={stations}
        selectedId={selectedId}
        boxFormat={boxFormat}
        boxSize={boxSize}
        hoveredLevel={hoveredLevel}
        hideNoData={hideNoData}
        hiddenLevels={hiddenLevels}
        overrides={overrides}
        referenceDate={referenceDate}
        onSelectStation={onSelectStation}
        onDragStation={onDragStation}
      />
      <MapClickHandler onClick={onMapClick} />
    </MapContainer>
  );
}
