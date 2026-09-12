import type { Node, NodeProps } from "@xyflow/react";

export interface RiverLabelData extends Record<string, unknown> {
  text: string;
  angle: number;
}

export type RiverLabelNodeType = Node<RiverLabelData, "riverLabel">;

/**
 * Nome do rio sobre o cano — texto branco em cima da linha grossa, igual ao
 * `.river-label` do mapa na ideia (itálico, halo), mas branco aqui porque
 * fica direto sobre o azul do cano, não sobre o cinza do basemap.
 * Não-interativo (`pointer-events:none`).
 */
export default function RiverLabelNode({ data }: NodeProps<RiverLabelNodeType>) {
  return (
    <div className="flow-river-label" style={{ transform: `rotate(${data.angle}deg)` }}>
      {data.text}
    </div>
  );
}
