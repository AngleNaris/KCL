// Playwright bridge: find an installed Playwright without adding a dependency, screenshot a URL or an SVG string.
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

export async function loadPlaywright() {
  const bases = [process.cwd(), os.homedir(), path.join(os.homedir(), '.local/lib/node_modules'), path.join(os.homedir(), '.local/lib/node_modules/@playwright/test')];
  try { bases.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()); } catch {}
  if (process.env.KCL_PLAYWRIGHT) bases.unshift(process.env.KCL_PLAYWRIGHT);
  for (const base of bases) {
    const req = createRequire(path.join(base, 'x.js'));
    for (const name of ['playwright', 'playwright-core', '@playwright/test']) { try { const mod = req(name); if (mod.chromium) return mod; } catch {} }
  }
  throw new Error('Playwright not found. Install it (npm i -g playwright && npx playwright install chromium) or set KCL_PLAYWRIGHT to a directory whose node_modules contains it.');
}

let shared = null;
export async function browser() { if (shared) return shared; const pw = await loadPlaywright(); shared = await pw.chromium.launch({ headless: true, args: ['--font-render-hinting=none'] }); return shared; }
export async function closeBrowser() { if (shared) { await shared.close(); shared = null; } }

// Screenshot a URL at the plate size. Waits for fonts and images. Returns a PNG buffer.
export async function shotUrl(url, { w, h, scale = 1, selector = null, fullPage = false } = {}) {
  const b = await browser(); const ctx = await b.newContext({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: scale }); const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; await Promise.all([...document.images].map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))); });
  await page.waitForTimeout(80);
  const png = selector ? await page.locator(selector).first().screenshot({ type: 'png' }) : await page.screenshot({ type: 'png', fullPage, clip: fullPage ? undefined : { x: 0, y: 0, width: w, height: h } });
  await ctx.close(); return png;
}
