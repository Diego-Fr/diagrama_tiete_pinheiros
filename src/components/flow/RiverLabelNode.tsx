import type { Node, NodeProps } from "@xyflow/react";

export interface RiverLabelData extends Record<string, unknown> {
  text: string;
  angle: number;
}

export type RiverLabelNodeType = Node<RiverLabelData, "riverLabel">;

/**
 * Nome do rio ao lado do cano (não mais em cima — pedido do usuário,
 * 2026-09-12). Estrutura em 2 camadas por causa do `fitView`: o node em si
 * (o que o React Flow mede pra bounding box) tem o tamanho JÁ girado
 * (`width`/`height` trocados em `FlowView.tsx` pros rótulos verticais,
 * ver `estimateLabelSize`) — mas o CONTEÚDO de texto em si precisa do
 * tamanho NATURAL (largo, não alto) antes de girar, senão o wrapper
 * (agora estreito) cortava o texto. Por isso o texto vive num div interno
 * `position:absolute` + centralizado + rotacionado, por cima de um wrapper
 * externo preenchendo 100% do node (sem isso o texto ficaria constrangido
 * à caixa estreita do próprio node e sairia cortado).
 */
export default function RiverLabelNode({ data }: NodeProps<RiverLabelNodeType>) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        className="flow-river-label"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${data.angle}deg)`,
        }}
      >
        {data.text}
      </div>
    </div>
  );
}
