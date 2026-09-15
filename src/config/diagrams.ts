import type { Region } from "@/types/station";

export interface DiagramOption {
  id: string;
  label: string;
  /** Bacia/área de interesse desse diagrama — decide qual dataset de postos
   * (`REGION_STATIONS`) e qual pacote curado (`FLOW_DIAGRAMS`) usar. */
  region: Region;
}

/**
 * Diagramas disponíveis no menu do título — cada um é uma área de
 * interesse/bacia diferente (2026-09-14: Tietê/Pinheiros e Ribeira de
 * Iguape). Selecionar troca o dataset de postos do mapa E o diagrama
 * curado, ver `App.tsx`/`AppTitleMenu.tsx`.
 */
export const AVAILABLE_DIAGRAMS: DiagramOption[] = [
  { id: "tiete-pinheiros", label: "Diagrama Tietê / Pinheiros", region: "tiete" },
  { id: "ribeira-iguape", label: "Diagrama Ribeira de Iguape", region: "ribeira" },
];
