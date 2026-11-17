import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStudio } from '../studio/server.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
function scratch() { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kcl-studio-')); const v1 = JSON.parse(fs.readFileSync(path.join(here, '../../examples/tide-heron.kcl-spec.json'), 'utf8')); v1.kcl = 'spec-v1'; for (const el of v1.elements) { delete el.weight; delete el.fill; delete el.ink; } fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(v1, null, 2)); fs.writeFileSync(path.join(dir, 'a.png'), Buffer.from('89504e470d0a1a0a0000000d49484452000000100000002008060000009fda7f7c', 'hex')); return dir; }

test('server: spec read, write with history, state signature, file sandbox', async () => {
  const dir = scratch(); const st = await startStudio({ specPath: path.join(dir, 'spec.json'), port: 0, refsDir: dir });
  try {
    const r = await fetch(`${st.url}/api/spec`).then((x) => x.json()); assert.equal(r.spec.kcl, 'spec-v1'); assert.equal(r.migrated.kcl, 'spec-v2');
    const s1 = await fetch(`${st.url}/api/state`).then((x) => x.json());
    const next = structuredClone(r.migrated); next.elements[0].id = 'edited'; next.elements.push({ kind: 'subject', id: 'pic', box: { x: 0, y: 0, w: 10, h: 10 }, levels: [{ src: 'a.png', mode: 'rendered' }] });
    const put = await fetch(`${st.url}/api/spec`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) }).then((x) => x.json()); assert.equal(put.ok, true);
    const on = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8')); assert.equal(on.kcl, 'spec-v2'); assert.equal(on.elements[0].id, 'edited');
    const s2 = await fetch(`${st.url}/api/state`).then((x) => x.json()); assert.notEqual(s1.sig, s2.sig); assert.equal(s2.assets['a.png'].w, 16); assert.equal(s2.assets['a.png'].h, 32);
    const hist = await fetch(`${st.url}/api/history`).then((x) => x.json()); assert.equal(hist.length, 1);
    const restored = await fetch(`${st.url}/api/restore`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ file: hist[0] }) }).then((x) => x.json()); assert.equal(restored.ok, true);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8')).kcl, 'spec-v1');
    assert.equal((await fetch(`${st.url}/file/../../etc/passwd`)).status, 404); assert.equal((await fetch(`${st.url}/file/a.png`)).status, 200);
    const refs = await fetch(`${st.url}/api/refs`).then((x) => x.json()); assert.equal(refs[0].name, 'a.png');
    const bad = await fetch(`${st.url}/api/spec`, { method: 'PUT', body: '{"kcl":"x"}' }).then((x) => x.json()); assert.match(bad.error, /spec-v2/);
    const html = await fetch(`${st.url}/`).then((x) => x.text()); assert.match(html, /KCL Studio/); const lib = await fetch(`${st.url}/lib/kcl-render.mjs`); assert.equal(lib.status, 200);
  } finally { st.server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('browser: plate renders, drag writes the spec back, Playwright shot and measure run', { skip: process.env.KCL_SKIP_BROWSER ? 'KCL_SKIP_BROWSER set' : false }, async (t) => {
  let pw; try { ({ loadPlaywright: pw } = await import('../browser.mjs')); pw = await pw(); } catch (e) { t.skip(`Playwright unavailable: ${e.message}`); return; }
  const dir = scratch(); const st = await startStudio({ specPath: path.join(dir, 'spec.json'), port: 0 }); const b = await pw.chromium.launch();
  try {
    const page = await b.newPage({ viewport: { width: 1500, height: 900 } }); const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(st.url, { waitUntil: 'networkidle' }); await page.waitForSelector('svg[data-kcl="plate"] [data-kind="bar"]');
    const barBefore = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8')).elements.find((e) => e.kind === 'bar');
    const bar = page.locator('svg[data-kcl="plate"] [data-kind="bar"]'); const box = await bar.boundingBox();
    const gx = box.x + box.width * 0.1, gy = box.y + box.height / 2; await page.mouse.move(gx, gy); await page.mouse.down(); await page.mouse.move(gx + 60, gy + 30, { steps: 6 }); await page.mouse.up();
    await page.waitForFunction(() => /已保存 bar move/.test(document.querySelector('#status').textContent), null, { timeout: 5000 });
    const after = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8')); const barAfter = after.elements.find((e) => e.kind === 'bar');
    assert.equal(after.kcl, 'spec-v2'); assert.ok(barAfter.x > barBefore.x && barAfter.y > barBefore.y, `bar moved ${JSON.stringify([barBefore, barAfter])}`);
    // external edit is picked up by polling
    after.elements.find((e) => e.kind === 'bar').id = 'from-disk'; fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(after));
    await page.waitForSelector('#elements .row:has-text("from-disk")', { timeout: 5000 });
    const { shotSpec, measureSpec } = await import('../plate.mjs'); const png = await shotSpec(path.join(dir, 'spec.json'), { base: st.url, keepBrowser: true }); assert.equal(png.subarray(1, 4).toString(), 'PNG');
    const m = await measureSpec(path.join(dir, 'spec.json'), { base: st.url }); assert.equal(m.w, 1440); assert.ok(m.coverage.paper > 0.3); assert.ok(Array.isArray(m.warnings));
    assert.deepEqual(errors, []);
  } finally { await b.close(); st.server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});
