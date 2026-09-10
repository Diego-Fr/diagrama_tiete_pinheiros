export interface DeclutterItem {
  id: number;
  /** Âncora (posição "verdadeira") em pixels de tela. */
  ax: number;
  ay: number;
  /** Meia-largura / meia-altura da caixa. */
  hw: number;
  hh: number;
}

export interface DeclutterOptions {
  /** Folga mínima entre caixas, em px. */
  gap?: number;
  /** Força da atração de volta à âncora, por iteração (0..1). */
  pull?: number;
  /** Teto de iterações. */
  iterations?: number;
}

export interface Offset {
  dx: number;
  dy: number;
}

/**
 * Separação iterativa de retângulos (estilo force-layout) em espaço de tela.
 * Em cada iteração: empurra pares sobrepostos pelo eixo de menor penetração e
 * puxa cada caixa de volta à âncora. Determinístico (desempate por índice) →
 * estável entre recálculos no mesmo zoom. O(n²·iterações); n ~ 21 aqui.
 */
export function declutter(
  items: DeclutterItem[],
  { gap = 4, pull = 0.04, iterations = 120 }: DeclutterOptions = {},
): Map<number, Offset> {
  const n = items.length;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const it = items[i]!;
    x[i] = it.ax;
    y[i] = it.ay;
  }

  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;

    for (let i = 0; i < n; i++) {
      const a = items[i]!;
      for (let j = i + 1; j < n; j++) {
        const b = items[j]!;
        const dx = x[i]! - x[j]!;
        const dy = y[i]! - y[j]!;
        const overlapX = a.hw + b.hw + gap - Math.abs(dx);
        const overlapY = a.hh + b.hh + gap - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        moved = true;
        if (overlapX < overlapY) {
          const push = overlapX / 2;
          const dir = dx === 0 ? (i < j ? 1 : -1) : Math.sign(dx);
          x[i]! += dir * push;
          x[j]! -= dir * push;
        } else {
          const push = overlapY / 2;
          const dir = dy === 0 ? (i < j ? 1 : -1) : Math.sign(dy);
          y[i]! += dir * push;
          y[j]! -= dir * push;
        }
      }
    }

    for (let i = 0; i < n; i++) {
      const it = items[i]!;
      x[i]! += (it.ax - x[i]!) * pull;
      y[i]! += (it.ay - y[i]!) * pull;
    }

    if (!moved) break;
  }

  const out = new Map<number, Offset>();
  for (let i = 0; i < n; i++) {
    const it = items[i]!;
    out.set(it.id, { dx: x[i]! - it.ax, dy: y[i]! - it.ay });
  }
  return out;
}
