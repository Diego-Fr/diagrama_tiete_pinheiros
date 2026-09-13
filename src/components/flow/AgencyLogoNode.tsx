import type { Node, NodeProps } from "@xyflow/react";
import spaguasLogo from "@/assets/spaguas-agencia-logo.png";
import sibhLogo from "@/assets/spaguas-logo.png";

export interface AgencyLogoNodeData extends Record<string, unknown> {
  variant: "spaguas" | "sibh";
}

export type AgencyLogoNodeType = Node<AgencyLogoNodeData, "agencyLogo">;

/**
 * Logo como "elemento" do próprio diagrama (não overlay solto como no
 * mapa) — pedido do usuário, 2026-09-13: SP Águas centralizada embaixo dos
 * afluentes do Tietê, com o SIBH logo abaixo dela (o print não carrega a
 * navbar, então sem isso a imagem exportada não tem referência explícita
 * ao SIBH). Posições curadas em `flowDiagram.ts` (`FLOW_LOGO_POSITION`/
 * `FLOW_SIBH_LOGO_POSITION`). Não-interativo.
 */
export default function AgencyLogoNode({ data }: NodeProps<AgencyLogoNodeType>) {
  if (data.variant === "sibh") {
    // wordmark é branco (feito pro fundo azul do LoginModal) — aqui o
    // fundo é claro (card do diagrama), então vira preto via filtro CSS,
    // mesma cor do texto da logo da SP Águas.
    return <img src={sibhLogo} alt="SIBH" className="flow-agency-logo flow-agency-logo--sibh" />;
  }
  return (
    <img
      src={spaguasLogo}
      alt="SP Águas — Agência de Águas do Estado de São Paulo"
      className="flow-agency-logo"
    />
  );
}
