/**
 * Barragens/estruturas de controle do sistema Tietê/Pinheiros — não são
 * postos de telemetria (não existem em `stations.raw.json`, não têm
 * measurement/parameter na API de estações), por isso ficam num arquivo
 * próprio. A situação das comportas em si vem de uma API diferente
 * (`/sibh/api/v1/dams`, ver `src/api/dams.ts`) — `apiDamId` é a ponte entre
 * os dois.
 */
export interface Barrage {
  id: string;
  name: string;
  /** Onde fica, em texto — mostrado na sidebar. */
  location: string;
  /** id real na API `/sibh/api/v1/dams` — só usamos 1 (Penha) e 2 (Móvel). */
  apiDamId: number;
  /** Nº de comportas — confirmado pelo usuário (2026-09-12): Penha tem 6;
   * Móvel tem 6 + 2 "de fundo" (a API chama de "F-1"/"F-2"). Usado como
   * fallback visual enquanto a lista real (`/sibh/api/v1/dams`) não
   * carregou — a lista definitiva vem de lá. */
  gateCount: number;
}

export const barrages: Barrage[] = [
  {
    id: "barragem-movel",
    name: "Barragem Móvel",
    location: "Confluência do Rio Pinheiros com o Rio Tietê (Cebolão/Pedreira)",
    apiDamId: 2,
    gateCount: 8,
  },
  {
    id: "barragem-penha",
    name: "Barragem da Penha",
    location: "Rio Tietê, altura da Penha",
    apiDamId: 1,
    gateCount: 6,
  },
];

export const barragesById = new Map(barrages.map((b) => [b.id, b]));
