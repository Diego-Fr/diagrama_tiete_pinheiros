import type { FeatureCollection } from "geojson";
import { WFS_BASE } from "@/config/rivers";

async function fetchOne(
  typeName: string,
  signal?: AbortSignal,
): Promise<FeatureCollection> {
  const params = new URLSearchParams({
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName: `sibh:${typeName}`,
    outputFormat: "application/json",
    maxFeatures: "50",
  });
  const res = await fetch(`${WFS_BASE}?${params.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`rivers ${typeName}: HTTP ${res.status}`);
  }
  return (await res.json()) as FeatureCollection;
}

/** Busca as camadas de rio e devolve uma FeatureCollection única. */
export async function fetchRivers(
  typeNames: string[],
  signal?: AbortSignal,
): Promise<FeatureCollection> {
  const collections = await Promise.all(
    typeNames.map((name) => fetchOne(name, signal)),
  );
  return {
    type: "FeatureCollection",
    features: collections.flatMap((c) => c.features ?? []),
  };
}
