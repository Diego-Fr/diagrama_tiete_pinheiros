#!/usr/bin/env node
/**
 * Script de teste de responsividade: abre o app em vários tamanhos de tela
 * (headless Chrome via puppeteer-core) e salva prints do mapa, da sidebar de
 * um posto e do modal ampliado para cada tamanho — pra visualmente conferir
 * se título/date-card, legenda, seletor de camada base e cabeçalho do modal
 * se comportam bem em telas estreitas.
 *
 * Uso:
 *   npm run screenshots:responsive
 *   node scripts/responsive-screenshots.mjs
 *
 * Se não houver um servidor em BASE_URL (padrão http://localhost:5173), o
 * script sobe `npm run dev` sozinho e derruba no final. Variáveis de
 * ambiente opcionais: PORT, BASE_URL, CHROME_PATH.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const OUT_DIR = path.join(ROOT, "screenshots", "responsive");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);
const CHROME_PATH = CHROME_CANDIDATES.find((p) => existsSync(p));

/** Tamanhos de tela cobertos — de desktop grande a celular pequeno. */
const VIEWPORTS = [
  { name: "01-desktop-1920x1080", width: 1920, height: 1080 },
  { name: "02-laptop-1366x768", width: 1366, height: 768 },
  { name: "03-laptop-pequeno-1024x768", width: 1024, height: 768 },
  { name: "04-tablet-768x1024", width: 768, height: 1024 },
  { name: "05-celular-grande-414x896", width: 414, height: 896 },
  { name: "06-celular-375x667", width: 375, height: 667 },
  { name: "07-celular-pequeno-320x568", width: 320, height: 568 },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isUp(url)) return;
    await sleep(300);
  }
  throw new Error(`Servidor não respondeu em ${url} depois de ${timeoutMs}ms`);
}

async function main() {
  if (!CHROME_PATH) {
    throw new Error(
      "Chrome não encontrado. Defina CHROME_PATH ou instale google-chrome.",
    );
  }
  await mkdir(OUT_DIR, { recursive: true });

  let devServer = null;
  if (!(await isUp(BASE_URL))) {
    console.log(`Nenhum servidor em ${BASE_URL} — subindo "npm run dev"...`);
    devServer = spawn(
      "npm",
      ["run", "dev", "--", "--port", String(PORT), "--strictPort"],
      { cwd: ROOT, stdio: "ignore", detached: true },
    );
    await waitForServer(BASE_URL);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  try {
    for (const vp of VIEWPORTS) {
      const dir = path.join(OUT_DIR, vp.name);
      await mkdir(dir, { recursive: true });

      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
      await page
        .waitForSelector(".leaflet-marker-icon.station-box-wrapper", {
          timeout: 15000,
        })
        .catch(() => {});
      await sleep(1000); // tiles/animações assentarem

      await page.screenshot({ path: path.join(dir, "01-mapa.png") });

      const box = await page.$(".leaflet-marker-icon.station-box-wrapper");
      if (box) {
        await box.click();
        await page
          .waitForSelector(".station-sidebar", { timeout: 8000 })
          .catch(() => {});
        await sleep(400);
        await page.screenshot({ path: path.join(dir, "02-sidebar.png") });

        const moreBtn = await page.$(".station-sidebar__more");
        if (moreBtn) {
          await moreBtn.click();
          await page
            .waitForSelector(".station-modal__panel", { timeout: 8000 })
            .catch(() => {});
          await sleep(500);
          await page.screenshot({ path: path.join(dir, "03-modal.png") });
        }
      }

      await page.close();
      console.log(`✓ ${vp.name} (${vp.width}x${vp.height})`);
    }
  } finally {
    await browser.close();
    if (devServer?.pid) {
      try {
        process.kill(-devServer.pid);
      } catch {
        // já encerrado
      }
    }
  }

  console.log(`\nPrints salvos em ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
