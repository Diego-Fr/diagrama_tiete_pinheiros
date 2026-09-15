import type { Node, NodeProps } from "@xyflow/react";
import barrageIcon from "@/assets/barragem-icon.png";

export interface RiverBarrageNodeData extends Record<string, unknown> {
  /** Nome da estrutura — só usado no `title` (tooltip), ainda sem sidebar
   * própria (sem API/dado real mapeado pra essas, diferente das barragens
   * do Tietê — `BarrageNode.tsx` — que têm status de comporta real). */
  name: string;
}

export type RiverBarrageNodeType = Node<RiverBarrageNodeData, "riverBarrage">;

/**
 * Ícone de barragem genérico (2026-09-15, pedido do usuário) — usa
 * DIRETO a imagem de referência que o usuário colocou na raiz do
 * projeto (`barragem.png`, copiada pra `src/assets/barragem-icon.png`),
 * não mais uma recriação em SVG à mão.
 *
 * **Histórico da mesma tarde**: a 1ª tentativa foi um SVG do zero
 * (parede fina, vãos ocupando quase toda a altura) — usuário apontou
 * "parece só uns quadrado saindo água". Redesenhei com parede bem maior
 * (2ª tentativa), mas o usuário ainda achou pouca parede e perguntou se
 * dava pra usar a imagem que ele já tinha passado — em vez de insistir
 * numa 3ª recriação vetorial, mais simples e mais fiel usar a imagem
 * original direto (mesmo padrão do `AgencyLogoNode.tsx`: `<img>`, sem
 * interatividade).
 *
 * Representa barragens SEM dado real de comporta ainda (diferente de
 * `BarrageNode.tsx`, que é interativo e mostra o status de cada comporta
 * via API — essas aqui são só um marcador visual "existe uma barragem
 * aqui", `title` com o nome no hover). Fica sobre o próprio cano (não
 * quebra a cadeia de edges — mesmo truque das barragens do Tietê: o
 * cano passa por baixo, contínuo, o ícone só sobrepõe visualmente). Sem
 * `Handle` — não-interativo, não conecta a nada.
 */
export default function RiverBarrageNode({ data }: NodeProps<RiverBarrageNodeType>) {
  return (
    <img
      src={barrageIcon}
      alt={data.name}
      title={data.name}
      className="flow-river-barrage"
    />
  );
}
