import type { CSSProperties } from "react";

/**
 * Estilo compartilhado pelos handles invisíveis de `AnchorNode` e
 * `StationFlowNode` — centralizados no nó (independe do `position` que o
 * `<Handle>` exige), sem interação. Assim toda pipe/leader liga exatamente
 * no centro do nó, igual ao padrão já usado nas leader-lines do mapa (a
 * linha "desaparece" atrás da caixa, que fica centrada no ponto).
 */
export const CENTERED_HANDLE_STYLE: CSSProperties = {
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  opacity: 0,
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  border: "none",
  background: "transparent",
  pointerEvents: "none",
};
