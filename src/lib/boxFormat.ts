/** Formato de exibição das caixas de posto no mapa. */
export type BoxFormat = "completo" | "default" | "basico" | "minimalista";

export const BOX_FORMATS: BoxFormat[] = [
  "completo",
  "default",
  "basico",
  "minimalista",
];

export const BOX_FORMAT_OPTIONS: {
  value: BoxFormat;
  label: string;
  hint: string;
}[] = [
  { value: "completo", label: "Completo", hint: "Nome do posto acima do valor" },
  { value: "default", label: "Padrão", hint: "Valor, tendência e mín/máx" },
  { value: "basico", label: "Básico", hint: "Sem a linha de mín/máx" },
  { value: "minimalista", label: "Minimalista", hint: "Apenas o valor" },
];

/** Dimensões da caixa (px) por formato, na escala padrão (1x) — usadas em
 * iconSize/anchor e no declutter (ver `scaledBoxDims` pra aplicar o
 * `BoxSize` escolhido pelo usuário). */
export const BOX_DIMS: Record<BoxFormat, { w: number; h: number }> = {
  completo: { w: 132, h: 54 },
  default: { w: 112, h: 38 },
  basico: { w: 98, h: 22 },
  minimalista: { w: 66, h: 20 },
};

/** Tamanho da caixa (independente do `BoxFormat`, que decide o CONTEÚDO) —
 * escala a caixa toda (dimensões + texto) tanto no mapa quanto no fluxo. */
export type BoxSize = "padrao" | "grande" | "extra-grande" | "gigante";

export const BOX_SIZES: BoxSize[] = ["padrao", "grande", "extra-grande", "gigante"];

export const BOX_SIZE_OPTIONS: { value: BoxSize; label: string; hint: string }[] = [
  { value: "padrao", label: "Padrão", hint: "Tamanho atual" },
  { value: "grande", label: "Médio", hint: "50% maior" },
  { value: "extra-grande", label: "Grande", hint: "75% maior" },
  { value: "gigante", label: "Extra Grande", hint: "100% maior" },
];

/** Multiplicador aplicado a `BOX_DIMS` e, via `--box-scale` (CSS, ver
 * `index.css`), ao texto/ícones/selo — a mesma escala serve pro mapa (que
 * também precisa do número em JS, pro `iconSize`/`iconAnchor`/declutter do
 * Leaflet) e pro fluxo (que só depende da variável CSS, já que o React Flow
 * mede o node renderizado sozinho). */
export const BOX_SIZE_SCALE: Record<BoxSize, number> = {
  padrao: 1,
  grande: 1.5,
  "extra-grande": 1.75,
  gigante: 2,
};

/** Dimensões finais (px, arredondadas) da caixa pro `format`+`size` dados —
 * usar em vez de `BOX_DIMS` direto sempre que o resultado for pro Leaflet
 * (iconSize/iconAnchor) ou pro declutter, que precisam de números exatos
 * (o CSS por si só, via `calc()`+`--box-scale`, já escala o VISUAL — mas o
 * Leaflet não lê variável CSS, precisa do pixel certo em JS). */
export function scaledBoxDims(format: BoxFormat, size: BoxSize): { w: number; h: number } {
  const base = BOX_DIMS[format];
  const scale = BOX_SIZE_SCALE[size];
  return { w: Math.round(base.w * scale), h: Math.round(base.h * scale) };
}
