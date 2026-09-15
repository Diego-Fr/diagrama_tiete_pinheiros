import type { Region } from "@/types/station";
import type { FlowDiagramConfig } from "./flowShared";
import { TIETE_FLOW_DIAGRAM } from "./flowDiagram";
import { RIBEIRA_FLOW_DIAGRAM } from "./flowDiagramRibeira";

/** Registro do diagrama curado de cada bacia — `FlowView.tsx` escolhe um
 * pacote por `Region` em vez de importar constantes fixas do Tietê direto
 * (2026-09-14, feature de múltiplas áreas de interesse). */
export const FLOW_DIAGRAMS: Record<Region, FlowDiagramConfig> = {
  tiete: TIETE_FLOW_DIAGRAM,
  ribeira: RIBEIRA_FLOW_DIAGRAM,
};
