import { toPng } from "html-to-image";

/**
 * Gera um PNG do elemento (clona o DOM numa `<svg><foreignObject>`, desenha
 * num canvas — via `html-to-image`) e dispara o download no navegador. Os
 * tiles do Esri precisam do `crossOrigin` no `<TileLayer>` (eles mandam
 * `Access-Control-Allow-Origin: *`) pra não "sujar" o canvas gerado.
 */
export async function downloadElementAsPng(
  node: HTMLElement,
  filename: string,
  pixelRatio = 2,
): Promise<void> {
  const dataUrl = await toPng(node, {
    pixelRatio,
    cacheBust: true,
    skipFonts: true,
  });
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
