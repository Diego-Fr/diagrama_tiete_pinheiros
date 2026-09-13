/**
 * Posição de cada posto no diagrama de fluxo (visão "esquema", não
 * geográfica) — inspirada no `example.png` da raiz do projeto: tronco
 * horizontal do Tietê + afluentes verticais entrando em ângulo reto.
 *
 * As posições NÃO seguem a lat/lng real (isso é o mapa) — mas a ORDEM segue
 * a geografia real: cada posto foi classificado por rio a partir do próprio
 * nome (`stations.raw.json`) e ordenado pela lat/lng real dentro do rio
 * (tronco: por longitude, oeste→leste = jusante→montante, já que o Tietê
 * nesse trecho corre "ao contrário", da serra pro interior; afluentes: por
 * latitude, distância até a confluência = montante).
 *
 * O espaçamento entre postos do tronco é uniforme (170px, estilo mapa de
 * metrô) — EXCETO nos dois pares Montante/Jusante de barragem (Móvel e da
 * Penha), que ficam bem mais próximos entre si (a barragem física é entre
 * os dois) — corrigido a partir de feedback comparando com o diagrama
 * original de verdade (print do usuário, 2026-09-12): a Penha fica entre
 * Tiquatira e Baquirivu (não entre Tamanduateí e Aricanduva, como na
 * primeira versão), os postos Montante/Jusante da Penha ficam bem
 * próximos da barragem (não no espaçamento padrão do tronco), São Miguel é
 * mais a montante que a foz do Itaquera, e o posto do Tamanduateí fica
 * perto da confluência (ramal curto).
 *
 * NENHUM posto fica em cima do cano — cada um flutua deslocado (perpendicular
 * à linha, alternando lado a lado pra não encavalar) e liga nele por um
 * "leader" fino tracejado (mesmo padrão do mapa). O cano em si é feito de
 * pontos invisíveis (`FLOW_JUNCTIONS`) + segmentos (`FLOW_PIPES`).
 *
 * Cobre as 21 fluviométricas atuais (mesmo escopo do mapa). Sem estação nova
 * aparecer nessa lista, ela não é desenhada no fluxo (fica só no mapa).
 */

export interface FlowStationPosition {
  stationId: number;
  x: number;
  y: number;
}

const TRUNK_Y = 400;
/** Quanto a caixa flutua acima/abaixo (tronco) ou dos lados (afluente
 * vertical) do cano — zigue-zague pra não encavalar caixas vizinhas. */
const OFF = 90;

// ---- Tronco do Rio Tietê: 13 pontos no cano, oeste=jusante → leste=montante.
//      Espaçamento uniforme (170px) exceto nos pares de barragem (Móvel:
//      índices 1-2; Penha: índices 5-6), bem mais próximos entre si — é
//      onde a barragem física fica; e o índice 7 (São Miguel, prefixo 508),
//      puxado mais pra direita (perto do Jardim Helena, índice 8) a pedido
//      do usuário (2026-09-13) — mantém a ordem (ainda antes do Jardim
//      Helena, que é mais a leste de verdade: -46.4158 vs -46.4231). ----
const TRUNK_X = [0, 170, 270, 440, 610, 780, 880, 1150, 1220, 1390, 1560, 1730, 1900];
const TRUNK_STATION_IDS = [
  33673, // 0 Santana de Parnaíba
  // 1-2: Montante (upstream) fica ANTES da barragem no sentido do fluxo —
  // como o Tietê corre pra oeste (esquerda) nesse trecho, "antes" = mais a
  // LESTE (índice mais alto) e "depois" (Jusante) = mais a OESTE (índice
  // mais baixo). Bate com a lat/lng real das duas estações (Montante,
  // -46.75083, fica a leste de Jusante, -46.75267). Uma correção anterior
  // (2026-09-12, mesmo dia) tinha invertido isso por engano, achando que o
  // nome "Montante" seria enganoso — não era; usuário corrigiu de volta.
  33698, // 1 Barragem Móvel Jusante (Cebolão) — depois da barragem, mais a oeste
  33720, // 2 Barragem Móvel Montante — antes da barragem, mais a leste
  33758, // 3 Ponte do Piqueri
  33741, // 4 Ponte Dutra
  33762, // 5 Barragem da Penha Jusante
  33675, // 6 Barragem da Penha Montante
  33771, // 7 São Miguel
  35335, // 8 Núcleo Jardim Helena
  35320, // 9 Núcleo Itaim Biacica
  33212, // 10 Jardim Romano
  35423, // 11 Itaquaquecetuba
  33209, // 12 Mogi das Cruzes (Estaleiro)
];

const trunkJunctionId = (i: number) => `j-trunk-${i}`;

export const FLOW_STATION_POSITIONS: FlowStationPosition[] = [
  // Tronco — zigue-zague acima/abaixo do cano.
  ...TRUNK_STATION_IDS.map((stationId, i) => ({
    stationId,
    x: TRUNK_X[i]!,
    y: TRUNK_Y + (i % 2 === 0 ? -OFF : OFF),
  })),

  // ---- Rio Pinheiros (5 postos) — ao sul do tronco, confluência a 245
  //      (perto da Barragem Móvel, x=170/270 — ela fica bem aí de verdade) ----
  { stationId: 92, x: 245 + OFF, y: 600 }, // Estrutura de Retiro (perto da confluência)
  { stationId: 114, x: 245 - 110, y: 800 }, // Superior — Usina Elevatória Traição
  { stationId: 109, x: 245 + 110, y: 800 }, // Inferior — Usina Elevatória Traição
  { stationId: 868, x: 245 - OFF, y: 1000 }, // Ponte João Dias
  { stationId: 117, x: 245 + OFF, y: 1200 }, // Pedreira, mais a montante

  // ---- Rio Tamanduateí (1 posto) — confluência a 555 (entre Ponte do
  //      Piqueri e Ponte Dutra); ramal CURTO — posto fica perto da
  //      confluência de verdade ----
  { stationId: 33767, x: 555 + OFF, y: 500 }, // Mercado Municipal

  // ---- Córrego Jacú (1 posto) — confluência a 1017 (entre Barragem da
  //      Penha Montante e São Miguel, mais perto da Penha). Deslocado pra
  //      ESQUERDA (não direita) — pra direita cruzaria o afluente do
  //      Itaquera, que passa logo ali (x=1035). ----
  { stationId: 33722, x: 1017 - OFF, y: 600 }, // Jd. Pantanal

  // ---- Rio Baquirivu (1 posto) — ao NORTE do tronco, confluência a 948
  //      (entre Barragem da Penha Montante e São Miguel, mais perto de
  //      São Miguel — lado oposto ao Jacú) ----
  { stationId: 35285, x: 948 - OFF, y: 200 }, // CECAP
];

export const FLOW_POSITION_BY_STATION_ID = new Map(
  FLOW_STATION_POSITIONS.map((p) => [p.stationId, p] as const),
);

/**
 * Pontos invisíveis do esquema — o cano em si (tronco + afluentes) e as
 * confluências. Postos nunca são um desses pontos; sempre flutuam ao lado,
 * ligados por um leader.
 */
export interface FlowJunction {
  id: string;
  x: number;
  y: number;
}

export const FLOW_JUNCTIONS: FlowJunction[] = [
  ...TRUNK_X.map((x, i) => ({ id: trunkJunctionId(i), x, y: TRUNK_Y })),
  { id: "j-pinheiros-0", x: 245, y: TRUNK_Y }, // confluência Pinheiros × Tietê
  { id: "j-pinheiros-1", x: 245, y: 600 }, // altura do Retiro
  { id: "j-pinheiros-2", x: 245, y: 800 }, // altura da Traição (os 2 leaders saem daqui)
  { id: "j-pinheiros-3", x: 245, y: 1000 }, // altura de Ponte João Dias
  { id: "j-pinheiros-4", x: 245, y: 1200 }, // altura de Pedreira, fim do cano
  { id: "j-tamanduatei-0", x: 555, y: TRUNK_Y }, // confluência Tamanduateí × Tietê
  { id: "j-tamanduatei-1", x: 555, y: 500 }, // altura do posto — continua perto da foz
  { id: "j-tamanduatei-2", x: 555, y: 720 }, // cano continua (só visual) — dá espaço pro nome do rio
  { id: "j-jacu-0", x: 1017, y: TRUNK_Y }, // confluência Córrego Jacú × Tietê
  { id: "j-jacu-1", x: 1017, y: 600 }, // fim do cano
  { id: "j-baquirivu-0", x: 948, y: TRUNK_Y }, // confluência Baquirivu × Tietê
  { id: "j-baquirivu-1", x: 948, y: 200 }, // altura do posto (leader sai daqui)
  { id: "j-baquirivu-2", x: 948, y: 140 }, // cano continua (só visual) — dá espaço pro nome do rio

  // ---- Afluentes só informativos (sem posto — não tem telemetria pra
  //      eles) — Aricanduva/Tiquatira/Itaquera/Tujuco Preto existem no
  //      diagrama original só pra dar contexto, não têm postos monitorados.
  //      Posições aproximadas: sem lat/lng real pra ancorar (nenhum posto
  //      nesses rios). Ordem/posição conferida contra o diagrama original
  //      (print do usuário, 2026-09-12): Aricanduva e Tiquatira ficam entre
  //      Ponte Dutra e a Barragem da Penha (não depois dela); Itaquera fica
  //      a jusante de São Miguel (mais perto do Jacú); Tujuco Preto bem
  //      mais a leste. ----
  { id: "j-aricanduva-0", x: 660, y: TRUNK_Y }, // confluência (entre Ponte Dutra e a Penha)
  { id: "j-aricanduva-1", x: 660, y: TRUNK_Y + 400 },
  { id: "j-tiquatira-0", x: 720, y: TRUNK_Y }, // confluência (entre Aricanduva e a Penha)
  { id: "j-tiquatira-1", x: 720, y: TRUNK_Y + 400 },
  { id: "j-itaquera-0", x: 1035, y: TRUNK_Y }, // confluência (entre Jacú e São Miguel — a jusante de São Miguel)
  { id: "j-itaquera-1", x: 1035, y: TRUNK_Y + 400 },
  { id: "j-tujucopreto-0", x: 1470, y: TRUNK_Y }, // confluência (bem mais a leste)
  { id: "j-tujucopreto-1", x: 1470, y: TRUNK_Y + 400 },
];

/** Extremo de uma pipe/leader: id de posto (número) ou de junção (string). */
export type FlowEndpoint = number | string;

export function endpointNodeId(e: FlowEndpoint): string {
  return typeof e === "number" ? String(e) : e;
}

export interface FlowPipe {
  id: string;
  from: FlowEndpoint;
  to: FlowEndpoint;
  river:
    | "tiete"
    | "pinheiros"
    | "tamanduatei"
    | "jacu"
    | "baquirivu"
    | "aricanduva"
    | "tiquatira"
    | "itaquera"
    | "tujucopreto";
}

/**
 * Segmentos do "cano" — linhas grossas representando o curso d'água, sempre
 * entre dois pontos de `FLOW_JUNCTIONS` (nunca um posto). Cada afluente
 * entra em ângulo reto no tronco, sem curva, como no `example.png`.
 */
export const FLOW_PIPES: FlowPipe[] = [
  // Tronco do Tietê — 12 segmentos entre os 13 pontos, em sequência.
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `p-tiete-${i}`,
    from: trunkJunctionId(i),
    to: trunkJunctionId(i + 1),
    river: "tiete" as const,
  })),

  // Rio Pinheiros — confluência → Retiro → Traição → João Dias → Pedreira.
  { id: "p-pinheiros-0", from: "j-pinheiros-0", to: "j-pinheiros-1", river: "pinheiros" },
  { id: "p-pinheiros-1", from: "j-pinheiros-1", to: "j-pinheiros-2", river: "pinheiros" },
  { id: "p-pinheiros-2", from: "j-pinheiros-2", to: "j-pinheiros-3", river: "pinheiros" },
  { id: "p-pinheiros-3", from: "j-pinheiros-3", to: "j-pinheiros-4", river: "pinheiros" },

  // Rio Tamanduateí — o posto fica perto da foz (j-tamanduatei-1), mas o
  // cano continua um pouco mais (j-tamanduatei-2, só visual) pra caber o
  // nome do rio — pedido do usuário: aumentar o rio, sem mexer na posição
  // do monitoramento.
  { id: "p-tamanduatei-0", from: "j-tamanduatei-0", to: "j-tamanduatei-1", river: "tamanduatei" },
  { id: "p-tamanduatei-1", from: "j-tamanduatei-1", to: "j-tamanduatei-2", river: "tamanduatei" },

  // Córrego Jacú — só 1 posto, segmento até o tronco.
  { id: "p-jacu-0", from: "j-jacu-0", to: "j-jacu-1", river: "jacu" },

  // Rio Baquirivu — só 1 posto, ao norte do tronco.
  { id: "p-baquirivu-0", from: "j-baquirivu-0", to: "j-baquirivu-1", river: "baquirivu" },
  { id: "p-baquirivu-1", from: "j-baquirivu-1", to: "j-baquirivu-2", river: "baquirivu" },

  // Afluentes só informativos — sem posto, só o cano + nome (ver nota em
  // FLOW_JUNCTIONS).
  { id: "p-aricanduva-0", from: "j-aricanduva-0", to: "j-aricanduva-1", river: "aricanduva" },
  { id: "p-tiquatira-0", from: "j-tiquatira-0", to: "j-tiquatira-1", river: "tiquatira" },
  { id: "p-itaquera-0", from: "j-itaquera-0", to: "j-itaquera-1", river: "itaquera" },
  { id: "p-tujucopreto-0", from: "j-tujucopreto-0", to: "j-tujucopreto-1", river: "tujucopreto" },
];

/**
 * Leaders — linha fina tracejada + bolinha ligando CADA posto ao ponto do
 * cano mais próximo (mesmo padrão visual do leader-line do mapa). Todo
 * posto tem um; a Traição tem dois saindo do mesmo ponto (não é um garfo de
 * verdade — "Superior"/"Inferior" são duas leituras da mesma usina
 * elevatória, como os pares Montante/Jusante das barragens no tronco — por
 * isso o cano principal fica reto e só os leaders se abrem pros dois lados).
 */
export const FLOW_LEADERS: FlowPipe[] = [
  ...TRUNK_STATION_IDS.map((stationId, i) => ({
    id: `l-trunk-${i}`,
    from: trunkJunctionId(i),
    to: stationId,
    river: "tiete" as const,
  })),
  { id: "l-pinheiros-retiro", from: "j-pinheiros-1", to: 92, river: "pinheiros" },
  { id: "l-traicao-sup", from: "j-pinheiros-2", to: 114, river: "pinheiros" },
  { id: "l-traicao-inf", from: "j-pinheiros-2", to: 109, river: "pinheiros" },
  { id: "l-pinheiros-joaodias", from: "j-pinheiros-3", to: 868, river: "pinheiros" },
  { id: "l-pinheiros-pedreira", from: "j-pinheiros-4", to: 117, river: "pinheiros" },
  { id: "l-tamanduatei", from: "j-tamanduatei-1", to: 33767, river: "tamanduatei" },
  { id: "l-jacu", from: "j-jacu-1", to: 33722, river: "jacu" },
  { id: "l-baquirivu", from: "j-baquirivu-1", to: 35285, river: "baquirivu" },
];

/** Rótulo (nome do rio) fixado num ponto do cano, com o ângulo de leitura. */
export interface FlowRiverLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  /** Graus de rotação do texto — 0 = horizontal (tronco), 90/-90 = ao longo
   * de um afluente vertical. */
  angle: number;
}

/** Distância (px, centro-a-centro) do rótulo até o próprio cano — fora da
 * linha, não mais em cima dela (pedido do usuário, 2026-09-12: "remove de
 * dentro do curso e coloca do lado"). Regra: linha vertical → rótulo à
 * ESQUERDA; linha horizontal (tronco) → rótulo EM CIMA. Única exceção:
 * Itaquera/Jacú ficam um do lado do outro (x=1035/1017, só 18px de vão) —
 * se os dois fossem pra esquerda (regra padrão), colidiriam; Itaquera vai
 * pra DIREITA (o lado de fora, afastando dos dois), Jacú mantém a regra
 * padrão (esquerda, que já era o lado de fora dele).
 * Valor calculado pra deixar ~2px de vão visual (não grudado, mas bem
 * perto — pedido do usuário): metade da espessura do cano (`strokeWidth:
 * 10` em `PipeEdge.tsx` → 5) + metade da espessura do próprio rótulo
 * (~18px de linha de texto → 9) + 2px de vão = 16. */
const LABEL_OFFSET = 16;

export const FLOW_RIVER_LABELS: FlowRiverLabel[] = [
  { id: "lbl-tiete-0", text: "RIO TIETÊ", x: 500, y: TRUNK_Y - LABEL_OFFSET, angle: 0 },
  { id: "lbl-tiete-1", text: "RIO TIETÊ", x: 1560, y: TRUNK_Y - LABEL_OFFSET, angle: 0 },
  { id: "lbl-pinheiros", text: "RIO PINHEIROS", x: 245 - LABEL_OFFSET, y: 900, angle: -90 },
  { id: "lbl-tamanduatei", text: "RIO TAMANDUATEÍ", x: 555 - LABEL_OFFSET, y: 580, angle: -90 },
  { id: "lbl-jacu", text: "CÓRREGO JACÚ", x: 1017 - LABEL_OFFSET, y: 500, angle: -90 },
  // Exceção: fica à DIREITA do cano (pedido do usuário, 2026-09-13) — os
  // demais afluentes verticais vão à esquerda, mas esse é o único que sobe
  // pro NORTE (não desce), e a régua no cano foi alongada até y=140 (ver
  // FLOW_JUNCTIONS `j-baquirivu-2`) só pra abrir espaço vertical suficiente
  // pro rótulo sem esbarrar no tronco (y=400) nem estourar a borda do
  // diagrama no print.
  { id: "lbl-baquirivu", text: "RIO BAQUIRIVU", x: 948 + LABEL_OFFSET, y: 270, angle: -90 },
  // Afluentes só informativos (sem posto — ver nota em FLOW_JUNCTIONS).
  { id: "lbl-aricanduva", text: "R. ARICANDUVA", x: 660 - LABEL_OFFSET, y: 600, angle: -90 },
  { id: "lbl-tiquatira", text: "RIB. TIQUATIRA", x: 720 - LABEL_OFFSET, y: 600, angle: -90 },
  // Exceção: Itaquera vai pra DIREITA (ver nota acima) — evita colidir com
  // o Jacú, que fica só 18px à esquerda dele (x=1017).
  { id: "lbl-itaquera", text: "RIO ITAQUERA", x: 1035 + LABEL_OFFSET, y: 600, angle: -90 },
  { id: "lbl-tujucopreto", text: "CÓR. TUJUCO PRETO", x: 1470 - LABEL_OFFSET, y: 600, angle: -90 },
];

/** Posição de cada barragem no esquema (só existem no fluxo — não têm
 * lat/lng real levantada, então não aparecem no mapa). Ficam sobre o
 * próprio tronco, na "boca" entre os dois postos Montante/Jusante daquela
 * estrutura — mesmo x do ponto médio entre eles (levemente deslocada da
 * junção do Pinheiros, no caso da Móvel, pra não empilhar em cima dela). */
export interface FlowBarragePosition {
  barrageId: string;
  x: number;
  y: number;
}

export const FLOW_BARRAGE_POSITIONS: FlowBarragePosition[] = [
  { barrageId: "barragem-movel", x: 210, y: TRUNK_Y }, // entre os postos de Barragem Móvel (x=170/270)
  { barrageId: "barragem-penha", x: 830, y: TRUNK_Y }, // entre os postos de Barragem da Penha (x=780/880)
];

export const FLOW_BARRAGE_POSITION_BY_ID = new Map(
  FLOW_BARRAGE_POSITIONS.map((p) => [p.barrageId, p] as const),
);

/** Logo da SP Águas, como elemento do próprio diagrama (pedido do usuário,
 * 2026-09-13) — centralizado embaixo dos afluentes do Tietê. `x` = meio do
 * tronco (0 a 1900); `y` ajustado a partir de um print que o usuário
 * marcou com a área desejada (a 1ª posição, y=1320, tinha ficado um pouco
 * abaixo do que ele queria). */
export const FLOW_LOGO_POSITION = { x: 950, y: 1030 };

/** Logo do SIBH, embaixo da SP Águas (pedido do usuário, 2026-09-13 — o
 * print não carrega a navbar, então sem isso a imagem exportada não tem
 * referência explícita ao SIBH). Mesmo `x`; `y` = abaixo da SP Águas
 * (centro 1030 + metade da altura dela, 119/2 ≈ 60) + ~20px de respiro. */
export const FLOW_SIBH_LOGO_POSITION = { x: 950, y: 1135 };
