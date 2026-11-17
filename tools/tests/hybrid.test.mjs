import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compositionMode, normalizeSpec, renderPlate, checkStructure, wireOverlay } from '../kcl-render.mjs';
import { judge } from '../measure.mjs';
import { renderFile } from '../plate.mjs';
import { encodePNG } from '../png.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const base = () => ({ kcl: 'spec-v2', artDirection: { mode: 'hybrid' }, canvas: { w: 800, h: 600 }, elements: [], flow: { entry: [0, 100], path: [[400, 300]], exit: [800, 500] } });
const material = (extra = {}) => ({ id: 'ornament', kind: 'material', src: 'ink.png', box: { x: 40, y: 50, w: 200, h: 300 }, ...extra });

test('hybrid accepts a single preserved illustration without reduced-style quotas', () => {
  const s = base(); s.elements = [{ id: 'hero', kind: 'subject', render: 'rendered', box: { x: 0, y: 0, w: 800, h: 600 }, levels: [{ src: 'hero.png', mode: 'rendered' }] }];
  assert.deepEqual(checkStructure(s).warnings, []);
  assert.equal(checkStructure(s).mode, 'hybrid');
  delete s.artDirection;
  assert.equal(compositionMode(s), 'reduced');
  assert.ok(checkStructure(s).warnings.some(w => w.includes('MAT-7')));
  s.artDirection = { mode: 'typo' };
  assert.throws(() => normalizeSpec(s), /artDirection.mode/);
});

test('material preserves color by default, has independent layer, fit, rotation and clip', () => {
  const s = base(); s.elements = [{ kind: 'frame', id: 'window', x: 0, y: 0, w: 300, h: 300 }, material({ fit: 'cover', align: [0, 1], layer: 'system', clip: 'window', rotate: 10, opacity: 0.7, blend: 'multiply' })];
  const svg = renderPlate(s, { resolve: s => `/assets/${s}` });
  assert.match(svg, /data-layer="system"[^]*data-kind="material"/);
  assert.match(svg, /href="\/assets\/ink.png"/);
  assert.match(svg, /preserveAspectRatio="xMinYMax slice"/);
  assert.match(svg, /rotate\(10 140 200\)/);
  assert.match(svg, /opacity="0.7" style="mix-blend-mode:multiply" clip-path=/);
  assert.doesNotMatch(svg, /feFlood/);
  assert.match(wireOverlay(s), /x="40" y="50" width="200" height="300"/);
  assert.doesNotMatch(renderPlate(s, { layers: ['ground', 'subject'] }), /data-kind="material"/);
  s.elements[1].tint = 'signal'; assert.match(renderPlate(s), /feFlood/);
  s.elements[1].fit = 'stretch'; assert.match(renderPlate(s), /preserveAspectRatio="none"/);
});

test('hybrid keeps actionable material diagnostics and rejects invalid placement', () => {
  const s = base(); s.elements = [material({ src: undefined, clip: 'missing' }), material()];
  const w = checkStructure(s).warnings.join('\n');
  assert.match(w, /asset pending/); assert.match(w, /duplicate element/); assert.match(w, /missing clip/);
  assert.match(renderPlate(s), /asset pending/);
  for (const extra of [{ box: { x: 0, y: 0, w: -1, h: 1 } }, { layer: 'typo' }, { fit: 'typo' }, { opacity: 2 }, { rotate: 'bad' }, { align: [0.2, 1] }, { blend: 'typo' }]) {
    s.elements = [material(extra)]; assert.throws(() => normalizeSpec(s));
  }
});

test('hybrid pixel measurements do not become compulsory density or midtone decoration', () => {
  const m = { w: 800, h: 600, coverage: { paper: 0.9, signal: 0 }, densest: 0.1, emptiest: 0, grid: Array(9).fill(0), midtone: 0.8, signalBlobPx: 0, apparatus: { classesPresent: [] }, interweave: { apparatusOverSubject: 0 } };
  assert.deepEqual(judge(m, { mode: 'hybrid', warnings: ['asset pending'] }), ['asset pending']);
  assert.ok(judge(m, { mode: 'reduced' }).length > 0);
});

test('material inline export and sketch work through real CLI/file paths', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kcl-hybrid-'));
  try {
    fs.writeFileSync(path.join(dir, 'ink.png'), encodePNG({ w: 2, h: 1, data: new Uint8Array([200, 100, 50, 255, 20, 40, 180, 128]) }));
    const s = base(); s.elements = [material()]; const file = path.join(dir, 'spec.json'); fs.writeFileSync(file, JSON.stringify(s));
    assert.match(renderFile(file, { inline: true }).svg, /href="data:image\/png;base64,/);
    const run = (...args) => execFileSync(process.execPath, [path.join(here, '../sketch.mjs'), ...args], { encoding: 'utf8' });
    const result = JSON.parse(run('check', file, '--json'));
    assert.equal(result.mode, 'hybrid'); assert.equal(result.softCount, 0); assert.deepEqual(result.warnings, []);
    const out = path.join(dir, 'sketch.svg'); run('render', file, '-o', out);
    const svg = fs.readFileSync(out, 'utf8'); assert.match(svg, /ornament/); assert.doesNotMatch(svg, /NaN/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
