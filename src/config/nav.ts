/**
 * Estrutura do menu principal — reflete a navbar do app Rails em produção
 * (print do usuário, 2026-09-12). "Operação" existe lá mas foi pedido pra
 * não entrar aqui. Os itens ainda não navegam pra lugar nenhum de verdade —
 * este app é uma SPA de diagrama só, sem roteamento pras outras telas
 * (Dados/Cadastro/etc. vivem no Rails); o pedido foi só "fazer a barra
 * aparecer".
 */
export interface NavSubItem {
  label: string;
}

export interface NavItem {
  label: string;
  items: NavSubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dados",
    items: [
      { label: "Fluviométricos" },
      { label: "Pluviométricos" },
      { label: "Dados Históricos" },
    ],
  },
  {
    label: "Mapas",
    items: [{ label: "Mapa Geral" }, { label: "Chuva Agora" }],
  },
  {
    label: "Diagramas",
    items: [{ label: "Alto Tietê" }],
  },
  {
    label: "Cadastro",
    items: [{ label: "Lista de Postos" }],
  },
];
