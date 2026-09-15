/**
 * Posição de cada posto no diagrama de fluxo da bacia do RIBEIRA DE IGUAPE
 * (2026-09-14) — 2ª bacia do app, mesmo padrão visual/arquitetura do Tietê
 * (`flowDiagram.ts`).
 *
 * **Reescrito no mesmo dia** — a 1ª versão tinha sido só uma aproximação de
 * memória da imagem de referência (posições "no olho"), e o usuário
 * corretamente apontou que ficou "bem diferente" do original, com rios
 * "não conectando" e formatos não respeitados. Essa versão foi refeita
 * MEDINDO a imagem de verdade: `diagrama ribeira.jpeg` (1600×767px) foi
 * processada com Python/PIL (`numpy`, detecção de pixel azul/preto por
 * coluna/linha) pra extrair a extensão exata de cada linha, canto e
 * rótulo — nada "no olho" dessa vez. Todo `x`/`y` abaixo é
 * `(pixel_da_imagem - origem)`, com a origem em `(92, 248)` (canto
 * superior-esquerdo do tronco na imagem) — ou seja, as coordenadas AQUI
 * são literalmente a imagem de referência, só deslocada pra origem
 * `(0,0)` no ponto onde o tronco começa. `TRUNK_Y = 400` é o `y` do
 * tronco nesse sistema (248 + 400 - 248... na prática só soma-se o
 * offset de cada feature em relação ao tronco, ver comentários).
 *
 * **Direção**: o Ribeira de Iguape corre de verdade oeste→leste (do
 * interior, Alto Ribeira/divisa com o Paraná, rumo ao litoral perto de
 * Iguape/Cananéia) — OPOSTO do Tietê nesse trecho. Por isso aqui `x`
 * crescente = OESTE→LESTE = MONTANTE→JUSANTE (no Tietê é o contrário).
 *
 * **Posições dos postos no tronco — ajustadas por indicação direta do
 * usuário (2026-09-14, 2ª rodada)**, que conhece a geografia real melhor
 * que a leitura pelos 6 waypoints/pontinhos da imagem (que não têm
 * rótulo — não dá pra saber só pela imagem qual é qual posto):
 *   5F-005 (Ribeira/Ponte Divisa Estadual) → ponto mais a montante de
 *   todos (onde antes estava o Iporanga) — bate com a longitude real,
 *   é a mais a oeste de todas (-49.003, literalmente na divisa com o
 *   Paraná, "Ponte Divisa Estadual" já diz isso no nome).
 *   Iporanga (-48.593) → move pro ponto seguinte (onde antes estava o
 *   Eldorado).
 *   Eldorado (-48.113) → move pra um ponto NOVO, entre o Rio Taquari e
 *   o Rio Etá (o waypoint que tinha sido pulado por cair embaixo do 1º
 *   rótulo "RIO RIBEIRA DE IGUAPE" — a caixa flutua ABAIXO do tronco
 *   ali, então não colide com o rótulo, que fica só 16px ACIMA).
 *   Sete Barras/Registro/Pariquera-Açu (jusante Jacupiranga) — mantidos
 *   onde já estavam.
 * O nome "Pariquera-Açu (Jusante Jacupiranga)" confirma sua posição:
 * fica logo DEPOIS de onde o Rio Jacupiranga entra no tronco.
 * **ATENÇÃO — não confundir**: existe um posto REAL "Pariquera-Açu
 * (Jusante Jacupiranga)" (a cidade) E um RIO informativo "Rio
 * Pariquera-Açu" — são coisas DIFERENTES; na imagem o rio entra no tronco
 * DEPOIS (mais a leste) de onde o posto fica.
 *
 * **Barra do Turvo (5F-010) não fica no tronco** — usuário apontou que
 * o pontinho preto de monitoramento que a imagem mostra EM CIMA do Rio
 * Pardo (não no tronco) é onde esse posto vai. Medido: y=526-529 da
 * imagem → y=678 aqui, entre a ramificação do Turvo (586) e a do
 * Capivari (748) — `j-pardo-dot`, novo, parte o antigo segmento único
 * `j-pardo-1→j-pardo-2` em dois.
 *
 * **Juquiá (4F-018) na ponta de montante do Rio Juquiá-Guaçu**
 * (2026-09-15, pedido do usuário) — o Rio Juquiá-Guaçu deixou de ser só
 * informativo, ganhou seu 1º posto real: flutua do lado LESTE de
 * `j-juquiaguacu-1`, lado oposto ao rótulo do rio.
 *
 * **Rio Juquiá dobrado + novo Rio Juquiá-Guaçu + 6 barragens**
 * (2026-09-15, mesmo dia, pedido do usuário) — reorganização: o que era
 * "Rio Juquiá-Guaçu" (linha vertical única, trunco↔y=234) virou **"Rio
 * Juquiá"**, DOBRADO de tamanho pra cima (agora vai até y=68 — o antigo
 * topo, y=234, onde o posto Juquiá já estava, ficou exatamente no MEIO
 * do novo comprimento, por construção: dobrar mantendo a base fixa
 * sempre deixa o ponto médio antigo no meio do novo). Um cano NOVO,
 * **"Rio Juquiá-Guaçu"**, gruda no topo do Juquiá (y=68) e vai pra OESTE
 * até x=114 — "alinhar com o Rio Ribeira de Iguape" foi interpretado
 * como alinhar com o início do próprio tronco (o ponto mais a montante
 * de "RIO RIBEIRA DE IGUAPE", onde fica o posto 5F-005) — **é uma
 * suposição, ajustar se não for o que o usuário quis dizer**. **6
 * barragens** (ícone novo, `RiverBarrageNode.tsx` — sem dado real
 * ainda, "depois eu coloco a lista de postos" segundo o usuário)
 * distribuídas com espaçamento igual ao longo do Rio JUQUIÁ-GUAÇU (não
 * o Juquiá — corrigido depois de um 1º engano, usuário apontou),
 * dividindo o comprimento em 7 partes iguais e pondo uma barragem em
 * cada um dos 6 pontos internos (exclui as duas pontas).
 *
 * Sem barragem monitorada conhecida nessa bacia — `FLOW_BARRAGE_POSITIONS`
 * fica vazio (o traço grosso perto do Rio Capivari na imagem é só a
 * pontinha/tampa decorativa do desenho original, sem API de comportas
 * como as barragens do Tietê — tratado como fim de linha comum). As 6
 * barragens do Juquiá usam `FLOW_SIMPLE_BARRAGES` (marcador visual, sem
 * API — ver `flowShared.ts`), não esse `FLOW_BARRAGE_POSITIONS`.
 *
 * **Sentido da vazão animada** (`PipeEdge.tsx`/`flow-pipe-move`,
 * `animation-direction: reverse`) — regra confirmada (2026-09-15):
 * **o traço claro anima visualmente EM DIREÇÃO AO `from` de cada pipe**
 * (começa perto do `to`, termina/chega perto do `from`). `from` é,
 * portanto, o ponto mais a JUSANTE de cada segmento (onde a água
 * "chega" visualmente).
 *
 * Chegar nessa regra precisou de verificação cuidadosa — 2 tentativas
 * anteriores deram resultado errado por causa de "aliasing" de
 * amostragem: o padrão do traço (`stroke-dasharray: 4 14`, período
 * 18px/1.1s) comparado entre 2 capturas separadas por ~metade do
 * período (550ms ≈ 9px) pode parear com o traço vizinho ERRADO,
 * indicando a direção oposta à real. **A verificação que resolveu**:
 * desacelerar a animação bem além do normal
 * (`animation-duration: 30s !important`, injetado via `page.evaluate`)
 * e comparar 5 capturas espaçadas (2s cada) — a essa velocidade o
 * deslocamento por captura é pequeno o bastante pra não ter ambiguidade
 * nenhuma, e dá pra acompanhar o mesmo traço claramente ao longo de
 * várias capturas seguidas (confirmado: o traço se desloca de forma
 * monotônica e consistente na mesma direção nas 5 capturas).
 *
 * Pro tronco (usuário: "ribeira corre da esquerda pra direita") e pro
 * Valo Grande (usuário: "corre de cima pra baixo"), `from` = ponto mais
 * a leste (tronco) / mais a jusante de cada segmento (Valo Grande: sai
 * do tronco, desce, sai pro leste — ver `FLOW_PIPES`). Os demais
 * afluentes (que só "deságuam" no tronco, sem sentido real tão
 * explícito) ficaram como estavam, sem reclamação do usuário.
 *
 * Isso ainda é uma curadoria — se algo não bater com a imagem original,
 * mandar print marcando o que está errado (mesmo processo já usado pro
 * Tietê, ex.: São Miguel, Baquirivu).
 */

import type {
  FlowBarragePosition,
  FlowDiagramConfig,
  FlowJunction,
  FlowPipe,
  FlowRiverLabel,
  FlowStationPosition,
} from "./flowShared";

const TRUNK_Y = 400;
/** Mesmo valor do Tietê — quanto a caixa flutua acima/abaixo do cano. */
const OFF = 90;

/** Posição de cada uma das 6 UHEs do Rio Juquiá-Guaçu (espaçamento igual,
 * comprimento 726 dividido em 7 partes) — usado tanto pelos ícones
 * (`FLOW_SIMPLE_BARRAGES`) quanto pelos postos que ficam no meio de cada
 * um (`FLOW_STATION_POSITIONS`), por isso fica aqui em cima (usado nos
 * dois lugares, declarado antes de qualquer um dos dois). */
const JGUACU_BARRAGE_STEP = (840 - 114) / 7;
const jguacuBarrageX = (i: number) => 840 - JGUACU_BARRAGE_STEP * i;

// ---- Tronco: 7 pontos (waypoints medidos na imagem + o ponto novo entre
//      Taquari/Etá pro Eldorado, ver cabeçalho). x = pixel_da_imagem - 92
//      pros medidos; 574 é o waypoint que tinha sido pulado (cai embaixo
//      do 1º rótulo "RIO RIBEIRA DE IGUAPE", mas a caixa do Eldorado
//      flutua ABAIXO do tronco, então não colide). Só 6 têm posto real; o
//      último (1401, fim do tronco desenhado) é só extensão do cano SEM
//      posto — sem ele, o Rio Pariquera-Açu/Canal do Valo Grande ficariam
//      boiando sem tocar o tronco (bug real da 1ª versão). ----
// Sete Barras puxado de 761→735 — no valor medido exato, a caixa (+ selo
// de atraso, que sai um pouco pra fora do canto) encostava no rótulo
// "RIO JUQUIÁ-GUAÇU" (x=840); 735 dá folga sem colidir com o Rio Etá
// (linha em x=660) do outro lado.
const TRUNK_X = [114, 344, 574, 735, 921, 1087, 1401];
/** Índice no `TRUNK_X` → posto (esparso — o último índice não tem posto).
 * `side` força o lado (acima/abaixo do tronco) quando o zigue-zague
 * automático por posição colidiria com algo — só o Eldorado precisa
 * disso (ficaria embaixo do rótulo "RIO RIBEIRA DE IGUAPE" se flutuasse
 * pra cima). Os demais alternam sozinhos pela ordem em que aparecem
 * aqui (não pelo índice do tronco, que agora tem furo no meio). */
const TRUNK_STATIONS: { index: number; stationId: number; side?: "above" | "below" }[] = [
  { index: 0, stationId: 29794 }, // 5F-005 Ribeira (Ponte Divisa Estadual) — mais a montante de todos
  { index: 1, stationId: 33203 }, // Iporanga (R. dos Expedicionários)
  { index: 2, stationId: 29791, side: "below" }, // Eldorado (Av. Beira Rio) — entre Taquari e Etá
  { index: 3, stationId: 29726 }, // Sete Barras (Banana)
  { index: 4, stationId: 26243 }, // Registro (Av. Marginal Castelo Branco)
  { index: 5, stationId: 1176 }, // Pariquera-Açu (Jusante Jacupiranga) — mais a jusante
];

const trunkJunctionId = (i: number) => `j-trunk-${i}`;

export const FLOW_STATION_POSITIONS: FlowStationPosition[] = [
  ...TRUNK_STATIONS.map(({ index, stationId, side }, pos) => {
    const above = side ? side === "above" : pos % 2 === 0;
    return {
      stationId,
      x: TRUNK_X[index]!,
      y: TRUNK_Y + (above ? -OFF : OFF),
    };
  }),

  // Barra do Turvo (5F-010) — no pontinho de monitoramento do Rio Pardo
  // (`j-pardo-dot`, x=220 y=678), não no tronco. Flutua pro lado OESTE
  // (o lado leste, na mesma altura, já tem o próprio Rio Turvo passando).
  { stationId: 30854, x: 220 - OFF, y: 678 },

  // Juquiá (Estrada do Pouso Alto, 4F-018) — na ponta de montante do Rio
  // Juquiá-Guaçu (`j-juquiaguacu-1`, x=840 y=234), pedido do usuário
  // (2026-09-15). Flutua pro lado LESTE (o rótulo "RIO JUQUIÁ-GUAÇU" já
  // fica do lado oeste da linha).
  { stationId: 29728, x: 840 + OFF, y: 234 },

  // ---- 8 postos de monitoramento das UHEs (2026-09-15, pedido do
  //      usuário: "posicione cada caixa no meio de cada SVG de barragem
  //      correspondente") — DIFERENTE de todos os outros postos desse
  //      arquivo: aqui a caixa NÃO flutua ao lado, ela fica exatamente
  //      em cima do ícone da UHE (mesmo x/y de `FLOW_SIMPLE_BARRAGES`).
  //      MESMO assim têm entrada em `FLOW_LEADERS` (pedido do usuário:
  //      "coloca a linha linkando") — com início/fim coincidindo (posto
  //      e junção no mesmo ponto) a "bolinha" do leader fica embaixo da
  //      caixa (SVG de edge sempre atrás dos nodes no React Flow), então
  //      NÃO aparece na tela — o ganho real é deixar o posto formalmente
  //      ligado ao cano no grafo (as 6 UHEs do meio viraram junções de
  //      verdade, não só coordenadas soltas — ver `FLOW_JUNCTIONS`/
  //      `FLOW_PIPES`). O ícone da barragem foi aumentado (48→90px,
  //      `FlowView.tsx`) pra "parede"/água aparecerem ao redor da caixa
  //      estreita — se "a linha linkando" pedida era outra coisa (não
  //      esse elo formal no grafo), falta confirmar com o usuário. Nomes
  //      cruzados com
  //      `stations_ribeira.raw.json` pelo nome da UHE no próprio nome
  //      do posto. ----
  { stationId: 9508, x: jguacuBarrageX(1), y: 68 }, // Juquiá (PCH Serraria Barramento)
  { stationId: 14437, x: jguacuBarrageX(2), y: 68 }, // Tapiraí (UHE Alecrim Barramento)
  { stationId: 14473, x: jguacuBarrageX(3), y: 68 }, // Tapiraí (PCH Porto Raso Barramento)
  { stationId: 14480, x: jguacuBarrageX(4), y: 68 }, // Tapiraí (UHE Barra Barramento)
  { stationId: 14815, x: jguacuBarrageX(5), y: 68 }, // Ibiúna (UHE Fumaça Barramento)
  { stationId: 14504, x: jguacuBarrageX(6), y: 68 }, // Juquitiba (UHE França Barramento)
  { stationId: 14508, x: 477, y: 68 - 166 }, // Piedade (UHE Jurupara Barramento)
  { stationId: 9545, x: 790, y: 68 - 166 }, // Juquiá (UHE Salto do Iporanga Barramento)
];

export const FLOW_POSITION_BY_STATION_ID = new Map(
  FLOW_STATION_POSITIONS.map((p) => [p.stationId, p] as const),
);

/**
 * Afluentes — coordenadas medidas direto da imagem (ver cabeçalho do
 * arquivo), não mais aproximadas. Ordem esquerda→direita igual à
 * referência: Pardo(+Turvo/Capivari aninhados) → Taquari → Etá →
 * Juquiá-Guaçu → Jacupiranga(+Guaraú aninhado) → Pariquera-Açu(rio) →
 * Canal do Valo Grande.
 */
export const FLOW_JUNCTIONS: FlowJunction[] = [
  ...TRUNK_X.map((x, i) => ({ id: trunkJunctionId(i), x, y: TRUNK_Y })),

  // Rio Taquari — vertical simples, sobe do tronco.
  { id: "j-taquari-0", x: 460, y: TRUNK_Y },
  { id: "j-taquari-1", x: 460, y: 234 },

  // Rio Etá — vertical simples, sobe do tronco.
  { id: "j-eta-0", x: 660, y: TRUNK_Y },
  { id: "j-eta-1", x: 660, y: 234 },

  // Rio Juquiá — vertical, sobe do tronco. Dobrado de tamanho (2026-09-15):
  // j-juquiaguacu-1 (y=234) era o topo original, virou o MEIO (é onde o
  // posto Juquiá já estava e continua); j-juquiaguacu-2 (y=68) é o novo
  // topo. Rio Juquiá-Guaçu (novo) gruda em j-juquiaguacu-2 e vai pra oeste.
  { id: "j-juquiaguacu-0", x: 840, y: TRUNK_Y },
  { id: "j-juquiaguacu-1", x: 840, y: 234 },
  { id: "j-juquiaguacu-2", x: 840, y: 68 },
  { id: "j-jguacu-0", x: 114, y: 68 }, // Rio Juquiá-Guaçu, ponta oeste (alinhado com o início do tronco)
  // As 6 UHEs — viraram JUNÇÕES DE VERDADE no cano (não só coordenadas
  // soltas que coincidiam visualmente com a linha reta) — pedido do
  // usuário (2026-09-15: "coloca a linha linkando, eu vi que não
  // colocou") pra cada posto ter uma "linha" (leader, ver
  // `FLOW_LEADERS`) ligando de verdade ao cano, igual todo outro posto
  // do diagrama. Partem o antigo segmento único `p-jguacu-0` em 7.
  { id: "j-uhe-1", x: jguacuBarrageX(1), y: 68 }, // Serraria
  { id: "j-uhe-2", x: jguacuBarrageX(2), y: 68 }, // Alecrim
  { id: "j-uhe-3", x: jguacuBarrageX(3), y: 68 }, // Porto Raso
  { id: "j-uhe-4", x: jguacuBarrageX(4), y: 68 }, // Barra
  { id: "j-uhe-5", x: jguacuBarrageX(5), y: 68 }, // Fumaça
  { id: "j-uhe-6", x: jguacuBarrageX(6), y: 68 }, // França

  // ---- Rio do Peixe e Rio Açungui (2026-09-15, pedido do usuário) — 2
  //      afluentes novos do Juquiá-Guaçu, subindo pra NORTE, do mesmo
  //      tamanho do Rio Etá (166px). Cada um termina numa UHE (barragem
  //      real, com posto de monitoramento — ver `FLOW_SIMPLE_BARRAGES`/
  //      `FLOW_STATION_POSITIONS`).
  //      R. do Peixe (UHE Jurupará na ponta) — gruda entre a UHE Porto
  //      Raso (x=528.86) e a UHE Barra (x=425.14), no meio dos dois.
  { id: "j-rpeixe-0", x: 477, y: 68 },
  { id: "j-rpeixe-1", x: 477, y: 68 - 166 },
  //      R. Açungui (UHE Salto do Iporanga na ponta) — "antes da UHE
  //      Serraria, antes de todas" = mais a jusante que a Serraria
  //      (x=736.29), entre ela e onde o Juquiá-Guaçu gruda no Juquiá
  //      (x=840).
  { id: "j-acungui-0", x: 790, y: 68 },
  { id: "j-acungui-1", x: 790, y: 68 - 166 },

  // ---- Cluster Pardo/Turvo/Capivari (entre Iporanga=114 e Eldorado=344)
  //      — 3 níveis aninhados, exatamente como a imagem: Pardo desce
  //      reto do tronco; Turvo ramifica pra LESTE bem no topo (y=586) e
  //      desce só um pouco (dead end); Capivari ramifica pra OESTE mais
  //      embaixo (y=748) — o Pardo continua um pouco além dessa
  //      ramificação (até y=786), exatamente como a linha original, que
  //      não termina bem na altura do Capivari. ----
  { id: "j-pardo-0", x: 220, y: TRUNK_Y }, // confluência Pardo × Ribeira
  { id: "j-pardo-1", x: 220, y: 586 }, // onde o Turvo ramifica
  { id: "j-pardo-dot", x: 220, y: 678 }, // pontinho de monitoramento da imagem — Barra do Turvo (5F-010)
  { id: "j-pardo-2", x: 220, y: 748 }, // onde o Capivari ramifica
  { id: "j-pardo-3", x: 220, y: 786 }, // Pardo continua um pouco além (fim real da linha)
  { id: "j-turvo-0", x: 416, y: 586 }, // Turvo vai pra LESTE a partir do Pardo
  { id: "j-turvo-1", x: 416, y: 703 }, // e desce (dead end)
  { id: "j-capivari-0", x: 3, y: 748 }, // Capivari vai pra OESTE a partir do Pardo (ponta decorativa)

  // ---- Rio Jacupiranga (entre Registro=921 e Pariquera-Açu/posto=1087)
  //      — desce do tronco e vira pra OESTE (não leste — corrigido da 1ª
  //      versão), com o Guaraú ramificando pra baixo no meio do caminho,
  //      exatamente como a imagem. ----
  { id: "j-jacupiranga-0", x: 1000, y: TRUNK_Y }, // confluência × Ribeira
  { id: "j-jacupiranga-1", x: 1000, y: 708 }, // desce até a altura do cano horizontal
  { id: "j-jacupiranga-2", x: 673, y: 708 }, // e vai pra OESTE (dead end)
  { id: "j-guarau-0", x: 880, y: 708 }, // Guaraú ramifica no meio do trecho horizontal
  { id: "j-guarau-1", x: 880, y: 830 }, // desce...
  { id: "j-guarau-2", x: 773, y: 830 }, // ...e vira pra OESTE no pé (dead end) — tinha
  // sido perdido na 1ª medição (confundido com o rótulo "RIO GUARAÚ", que
  // fica bem colado nessa mesma faixa de altura) — usuário apontou
  // (2026-09-14) que o Guaraú é um "L", não uma reta; re-medido de perto
  // (crop 830-1010 × 540-700 da imagem) e confirmado: tem sim um pé de
  // ~4px de espessura em y=675-678 (imagem), constante nas 4 linhas — bem
  // diferente do texto acima dele (y=656-665), que varia linha a linha
  // (itálico). Mesmo formato do pé do Rio Jacupiranga/Pariquera-Açu.

  // Rio Pariquera-Açu (O RIO — não confundir com o posto real "Pariquera-
  // Açu (Jusante Jacupiranga)", ver nota no topo) — desce e vira pra
  // OESTE no pé (dead end), entre o posto real (1087) e o Canal do Valo
  // Grande (1274).
  { id: "j-pariqueracu-0", x: 1174, y: TRUNK_Y },
  { id: "j-pariqueracu-1", x: 1174, y: 709 },
  { id: "j-pariqueracu-2", x: 1093, y: 709 }, // pé vira pra OESTE

  // Canal do Valo Grande — desce e vira pra LESTE no pé (dead end), o
  // mais a leste de todos, perto do fim do tronco desenhado (1401).
  { id: "j-valogrande-0", x: 1274, y: TRUNK_Y },
  { id: "j-valogrande-1", x: 1274, y: 769 },
  { id: "j-valogrande-2", x: 1396, y: 769 }, // pé vira pra LESTE
];

export const FLOW_PIPES: FlowPipe[] = [
  // Tronco — um segmento entre cada par de pontos consecutivos (deriva do
  // tamanho do array, não um número fixo — lição aprendida com o bug do
  // Tietê em 2026-09-14: nunca hardcodar essa contagem). A animação
  // visual corre de `to` pra `from` (ver nota grande no topo do arquivo
  // — 3 tentativas até acertar essa regra) — pra o Ribeira aparentar
  // oeste→leste (pedido do usuário), `from` = ponto mais a LESTE de
  // cada par.
  ...Array.from({ length: TRUNK_X.length - 1 }, (_, i) => ({
    id: `p-ribeira-${i}`,
    from: trunkJunctionId(i + 1),
    to: trunkJunctionId(i),
    river: "ribeira",
  })),

  { id: "p-taquari-0", from: "j-taquari-0", to: "j-taquari-1", river: "taquari" },
  { id: "p-eta-0", from: "j-eta-0", to: "j-eta-1", river: "eta" },
  // Rio Juquiá — 2 segmentos agora (dobrado, ver nota no topo do
  // arquivo). `from` continua o mais a jusante em cada um (mesma regra
  // do tronco — água "chega" no `from`, ver nota grande no topo).
  { id: "p-juquiaguacu-0", from: "j-juquiaguacu-0", to: "j-juquiaguacu-1", river: "juquia" },
  { id: "p-juquiaguacu-1", from: "j-juquiaguacu-1", to: "j-juquiaguacu-2", river: "juquia" },
  // Rio Juquiá-Guaçu (novo) — gruda no topo do Juquiá e vai pra oeste.
  // Rio Juquiá-Guaçu — 7 segmentos agora (era 1 só), passando pelas 6
  // junções das UHEs (ver `FLOW_JUNCTIONS`). Mesma direção de antes
  // (não invertida — "os demais afluentes ficaram como estavam").
  { id: "p-jguacu-0", from: "j-juquiaguacu-2", to: "j-uhe-1", river: "juquiaguacu" },
  { id: "p-jguacu-1", from: "j-uhe-1", to: "j-uhe-2", river: "juquiaguacu" },
  { id: "p-jguacu-2", from: "j-uhe-2", to: "j-uhe-3", river: "juquiaguacu" },
  { id: "p-jguacu-3", from: "j-uhe-3", to: "j-uhe-4", river: "juquiaguacu" },
  { id: "p-jguacu-4", from: "j-uhe-4", to: "j-uhe-5", river: "juquiaguacu" },
  { id: "p-jguacu-5", from: "j-uhe-5", to: "j-uhe-6", river: "juquiaguacu" },
  { id: "p-jguacu-6", from: "j-uhe-6", to: "j-jguacu-0", river: "juquiaguacu" },
  // Rio do Peixe e Rio Açungui — mesma convenção do Etá/Taquari (não
  // invertidos, "os demais afluentes ficaram como estavam" — ver nota
  // grande no topo do arquivo).
  { id: "p-rpeixe-0", from: "j-rpeixe-0", to: "j-rpeixe-1", river: "rpeixe" },
  { id: "p-acungui-0", from: "j-acungui-0", to: "j-acungui-1", river: "acungui" },

  { id: "p-pardo-0", from: "j-pardo-0", to: "j-pardo-1", river: "pardo" },
  { id: "p-pardo-1", from: "j-pardo-1", to: "j-pardo-dot", river: "pardo" },
  { id: "p-pardo-2", from: "j-pardo-dot", to: "j-pardo-2", river: "pardo" },
  { id: "p-pardo-3", from: "j-pardo-2", to: "j-pardo-3", river: "pardo" },
  { id: "p-turvo-0", from: "j-pardo-1", to: "j-turvo-0", river: "turvo" },
  { id: "p-turvo-1", from: "j-turvo-0", to: "j-turvo-1", river: "turvo" },
  { id: "p-capivari-0", from: "j-pardo-2", to: "j-capivari-0", river: "capivari" },

  { id: "p-jacupiranga-0", from: "j-jacupiranga-0", to: "j-jacupiranga-1", river: "jacupiranga" },
  { id: "p-jacupiranga-1", from: "j-jacupiranga-1", to: "j-jacupiranga-2", river: "jacupiranga" },
  { id: "p-guarau-0", from: "j-jacupiranga-1", to: "j-guarau-0", river: "guarau" },
  { id: "p-guarau-1", from: "j-guarau-0", to: "j-guarau-1", river: "guarau" },
  { id: "p-guarau-2", from: "j-guarau-1", to: "j-guarau-2", river: "guarau" },

  { id: "p-pariqueracu-0", from: "j-pariqueracu-0", to: "j-pariqueracu-1", river: "pariqueracu" },
  { id: "p-pariqueracu-1", from: "j-pariqueracu-1", to: "j-pariqueracu-2", river: "pariqueracu" },

  // Canal do Valo Grande — água sai do tronco principal e entra no canal
  // (é um canal artificial que desvia parte da vazão do Ribeira pro Mar
  // Pequeno, perto de Iguape — histórico real, não é só estética): visual
  // tronco → desce → pé-leste (pedido do usuário: "corre de cima pra
  // baixo"). Mesma regra do tronco (ver nota grande no topo do arquivo)
  // — `from` é sempre o ponto mais a JUSANTE de cada segmento.
  { id: "p-valogrande-0", from: "j-valogrande-1", to: "j-valogrande-0", river: "valogrande" },
  { id: "p-valogrande-1", from: "j-valogrande-2", to: "j-valogrande-1", river: "valogrande" },
];

/** Leaders — só os postos reais têm (os afluentes informativos não têm
 * telemetria, então não têm caixa nenhuma pra ligar). */
export const FLOW_LEADERS: FlowPipe[] = [
  ...TRUNK_STATIONS.map(({ index, stationId }) => ({
    id: `l-trunk-${index}`,
    from: trunkJunctionId(index),
    to: stationId,
    river: "ribeira",
  })),
  // Barra do Turvo (5F-010) — não fica no tronco, fica no pontinho de
  // monitoramento em cima do Rio Pardo (ver cabeçalho do arquivo).
  { id: "l-pardo-dot", from: "j-pardo-dot", to: 30854, river: "pardo" },
  // Juquiá (4F-018) — na ponta de montante do Rio Juquiá-Guaçu.
  { id: "l-juquiaguacu", from: "j-juquiaguacu-1", to: 29728, river: "juquiaguacu" },
  // 8 UHEs (2026-09-15) — posto e junção coincidem no mesmo ponto (a
  // caixa fica "no meio do SVG" da barragem), mas ainda ganham leader
  // (pedido do usuário: "coloca a linha linkando").
  { id: "l-uhe-1", from: "j-uhe-1", to: 9508, river: "juquiaguacu" }, // Serraria
  { id: "l-uhe-2", from: "j-uhe-2", to: 14437, river: "juquiaguacu" }, // Alecrim
  { id: "l-uhe-3", from: "j-uhe-3", to: 14473, river: "juquiaguacu" }, // Porto Raso
  { id: "l-uhe-4", from: "j-uhe-4", to: 14480, river: "juquiaguacu" }, // Barra
  { id: "l-uhe-5", from: "j-uhe-5", to: 14815, river: "juquiaguacu" }, // Fumaça
  { id: "l-uhe-6", from: "j-uhe-6", to: 14504, river: "juquiaguacu" }, // França
  { id: "l-uhe-rpeixe", from: "j-rpeixe-1", to: 14508, river: "rpeixe" }, // Jurupará
  { id: "l-uhe-acungui", from: "j-acungui-1", to: 9545, river: "acungui" }, // Salto do Iporanga
];

/** Mesmo offset do Tietê. */
const LABEL_OFFSET = 16;

export const FLOW_RIVER_LABELS: FlowRiverLabel[] = [
  // As 2 ocorrências de "RIO RIBEIRA DE IGUAPE" (medidas: a 1ª fica entre
  // Taquari e Etá, a 2ª entre a descida do Jacupiranga e o Rio
  // Pariquera-Açu — igual ao Tietê ter "RIO TIETÊ" 2x ao longo do tronco).
  { id: "lbl-ribeira-0", text: "RIO RIBEIRA DE IGUAPE", x: 202, y: TRUNK_Y - LABEL_OFFSET, angle: 0 },
  { id: "lbl-ribeira-1", text: "RIO RIBEIRA DE IGUAPE", x: 1108, y: TRUNK_Y - LABEL_OFFSET, angle: 0 },

  { id: "lbl-taquari", text: "RIO TAQUARI", x: 460 - LABEL_OFFSET, y: 317, angle: -90 },
  { id: "lbl-eta", text: "RIO ETÁ", x: 660 - LABEL_OFFSET, y: 317, angle: -90 },
  // Rio Juquiá (era "Juquiá-Guaçu") — posição inalterada (234, meio do
  // trecho 68↔400 velho topo virou o meio, por construção — ver nota no
  // topo do arquivo).
  { id: "lbl-juquia", text: "RIO JUQUIÁ", x: 840 - LABEL_OFFSET, y: 350, angle: -90 },
  // Rio Juquiá-Guaçu (novo, horizontal) — rótulo em cima do trecho. Não
  // fica mais centralizado (x=477 colidia com o Rio do Peixe, que gruda
  // bem ali — ver abaixo) — reposicionado pro vão entre a ponta oeste
  // (114) e a UHE França (217.71), livre de qualquer cano/barragem. y
  // bem mais acima que o padrão de 16px (LABEL_OFFSET) — as barragens
  // (ícone real, 48×48, centralizado no cano em y=68 → ocupa até y=44)
  // encostariam no rótulo se ele ficasse coladinho no cano como de
  // costume (2026-09-15: subido pra abrir espaço, depois que o ícone
  // virou a imagem de verdade, bem maior que a 1ª tentativa em SVG).
  { id: "lbl-jguacu", text: "RIO JUQUIÁ-GUAÇU", x: 100, y: 50, angle: 0 },
  // Rio do Peixe e Rio Açungui — mesma regra dos afluentes verticais
  // (rótulo à esquerda, giro -90), altura no meio do trecho (68 a -98).
  { id: "lbl-rpeixe", text: "RIO DO PEIXE", x: 477 - LABEL_OFFSET, y: -15, angle: -90 },
  { id: "lbl-acungui", text: "RIO AÇUNGUI", x: 790 - LABEL_OFFSET, y: -15, angle: -90 },

  { id: "lbl-pardo", text: "RIO PARDO", x: 220 - LABEL_OFFSET, y: 593, angle: -90 },
  // Turvo/Capivari/Jacupiranga/Guaraú correm na HORIZONTAL na imagem
  // (não são afluentes verticais) — rótulo em cima do trecho, sem giro
  // (mesma regra do tronco: linha horizontal → rótulo em cima).
  { id: "lbl-turvo", text: "RIO TURVO", x: 318, y: 586 - LABEL_OFFSET, angle: 0 },
  { id: "lbl-capivari", text: "RIO CAPIVARI", x: 112, y: 748 - LABEL_OFFSET, angle: 0 },
  { id: "lbl-jacupiranga", text: "RIO JACUPIRANGA", x: 836, y: 708 - LABEL_OFFSET, angle: 0 },
  // Guaraú: rótulo horizontal à esquerda do pé da linha (não em cima —
  // é vertical, mas o texto na imagem não é rotacionado, fica ao lado).
  { id: "lbl-guarau", text: "RIO GUARAÚ", x: 833, y: 810, angle: 0 }, // acima do pé, medido

  { id: "lbl-pariqueracu", text: "RIO PARIQUERA-AÇU", x: 1174 - LABEL_OFFSET, y: 554, angle: -90 },
  { id: "lbl-valogrande", text: "CANAL DO VALO GRANDE", x: 1274 - LABEL_OFFSET, y: 584, angle: -90 },
];

/** Sem barragem monitorada conhecida nessa bacia (ver nota no topo). */
export const FLOW_BARRAGE_POSITIONS: FlowBarragePosition[] = [];
export const FLOW_BARRAGE_POSITION_BY_ID = new Map<string, FlowBarragePosition>();

/**
 * 8 UHEs (usinas hidrelétricas) — 6 no Rio Juquiá-Guaçu (espaçamento
 * igual, comprimento 726 dividido em 7 partes iguais, ver conta abaixo)
 * + 2 na ponta dos afluentes novos (Rio do Peixe/Rio Açungui). Nomes
 * reais confirmados pelo usuário (2026-09-15, cruzados com
 * `stations_ribeira.raw.json` pelo nome do posto de monitoramento —
 * ver `FLOW_STATION_POSITIONS`, cada posto fica exatamente NO MEIO do
 * ícone da UHE correspondente, não flutuando ao lado como os demais).
 * "Da direita pra esquerda" (jusante→montante, mesma convenção de `x`
 * crescente=oeste→leste): Serraria, Alecrim, Porto Raso, Barra, Fumaça,
 * França. (`jguacuBarrageX`/`JGUACU_BARRAGE_STEP` declarados lá em cima,
 * perto do `OFF` — precisam existir antes de `FLOW_STATION_POSITIONS`
 * também usar.)
 */
export const FLOW_SIMPLE_BARRAGES = [
  { id: "uhe-serraria", name: "UHE Serraria", x: jguacuBarrageX(1), y: 68 },
  { id: "uhe-alecrim", name: "UHE Alecrim", x: jguacuBarrageX(2), y: 68 },
  { id: "uhe-portoraso", name: "UHE Porto Raso", x: jguacuBarrageX(3), y: 68 },
  { id: "uhe-barra", name: "UHE Barra", x: jguacuBarrageX(4), y: 68 },
  { id: "uhe-fumaca", name: "UHE Fumaça", x: jguacuBarrageX(5), y: 68 },
  { id: "uhe-franca", name: "UHE França", x: jguacuBarrageX(6), y: 68 },
  // Nas pontas do Rio do Peixe/Rio Açungui (ver `FLOW_JUNCTIONS`).
  { id: "uhe-jurupara", name: "UHE Jurupará", x: 477, y: 68 - 166 },
  { id: "uhe-saltoiporanga", name: "UHE Salto do Iporanga", x: 790, y: 68 - 166 },
];

/** Mesmo tratamento do Tietê: logos centralizados embaixo do tronco. `x` =
 * meio do tronco medido ((114+1401)/2 ≈ 758); `y` abaixo de onde os
 * afluentes mais fundos terminam (Guaraú vai até y=830 — ~150px de
 * respiro). */
export const FLOW_LOGO_POSITION = { x: 650, y: 800 };
export const FLOW_SIBH_LOGO_POSITION = { x: 650, y: 890 };

export const RIBEIRA_FLOW_DIAGRAM: FlowDiagramConfig = {
  FLOW_STATION_POSITIONS,
  FLOW_POSITION_BY_STATION_ID,
  FLOW_JUNCTIONS,
  FLOW_PIPES,
  FLOW_LEADERS,
  FLOW_RIVER_LABELS,
  FLOW_BARRAGE_POSITIONS,
  FLOW_BARRAGE_POSITION_BY_ID,
  FLOW_SIMPLE_BARRAGES,
  FLOW_LOGO_POSITION,
  FLOW_SIBH_LOGO_POSITION,
};
