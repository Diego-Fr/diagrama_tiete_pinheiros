export interface DiagramOption {
  id: string;
  label: string;
}

/**
 * Diagramas disponíveis no menu do título. Por enquanto só existe o do
 * Tietê / Pinheiros — futuramente outros diagramas da mesma estrutura
 * entram nesta lista.
 */
export const AVAILABLE_DIAGRAMS: DiagramOption[] = [
  { id: "tiete-pinheiros", label: "SIBH – Diagrama Tietê / Pinheiros" },
];
