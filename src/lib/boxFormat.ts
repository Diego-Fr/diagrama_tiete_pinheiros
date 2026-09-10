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

/** Dimensões da caixa (px) por formato — usadas em iconSize/anchor e no declutter. */
export const BOX_DIMS: Record<BoxFormat, { w: number; h: number }> = {
  completo: { w: 132, h: 54 },
  default: { w: 112, h: 38 },
  basico: { w: 98, h: 22 },
  minimalista: { w: 66, h: 20 },
};
