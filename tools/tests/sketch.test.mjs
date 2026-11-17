import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.join(here, '..', 'sketch.mjs');
const example = path.join(here, '..', '..', 'examples', 'tide-heron.kcl-spec.json');
const run = (...a) => execFileSync('node', [bin, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kcl-sketch-'));
const base = JSON.parse(fs.readFileSync(example, 'utf8'));
const variant = (mutate) => { const s = structuredClone(base); mutate(s); const p = path.join(tmp, `${Math.random().toString(36).slice(2)}.json`); fs.writeFileSync(p, JSON.stringify(s)); return p; };
const isXml = (file) => { const s = fs.readFileSync(file, 'utf8'); assert.match(s, /^<svg /); assert.doesNotMatch(s, /font-family="[^"]*"[^ >\/]/, "nested double quotes in attributes"); const opens = (s.match(/<(g|svg|defs|clipPath|pattern|marker|filter)\b/g) || []).length; const closes = (s.match(/<\/(g|svg|defs|clipPath|pattern|marker|filter)>/g) || []).length; assert.equal(opens, closes, 'unbalanced container tags'); };

test('render writes a well-formed sketch with flow, stations and legend', () => {
  const out = path.join(tmp, 'a.svg');
  run('render', example, '-o', out, '--grid');
  isXml(out);
  const s = fs.readFileSync(out, 'utf8');
  assert.match(s, /marker-mid="url\(#k-arrow\)"/);
  assert.equal((s.match(/<circle cx="[\d.]+" cy="[\d.]+" r="13"/g) || []).length, 4, 'four stations');
  assert.match(s, /张力 A heron/);
  assert.match(s, /苍鹭 heron · silhouette\+line/);
});

test('check reports the example clean and flags a flow that misses the subject', () => {
  const clean = JSON.parse(run('check', example, '--json'));
  assert.deepEqual(clean.warnings, []);
  assert.ok(clean.scaleRatio >= 12 && clean.interweave >= 2 && clean.softCount === 1);
  const bad = variant((s) => { s.flow.path = [[60, 40], [1380, 40]]; s.flow.entry = [20, 40]; s.flow.exit = [1420, 40]; s.elements = s.elements.filter((e) => e.kind !== 'soft'); });
  const r = JSON.parse(run('check', bad, '--json'));
  assert.ok(r.warnings.some((w) => w.includes('动线未经过主体 heron')));
  assert.ok(r.warnings.some((w) => w.includes('软元素 0')));
});

test('sheet lays candidates side by side with letters', () => {
  const b = variant((s) => { s.title = 'B'; });
  const out = path.join(tmp, 'sheet.svg');
  run('sheet', example, b, '-o', out);
  isXml(out);
  const s = fs.readFileSync(out, 'utf8');
  assert.match(s, />A<\/text>/); assert.match(s, />B<\/text>/);
  assert.match(s, /id="s1-arrow"/);
});

test('overlay embeds the png and scales the wire to its size', () => {
  // 2×2 PNG header is enough: the tool reads IHDR only.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAC0lEQVQI12NgQAcAABIAAeRVjecAAAAASUVORK5CYII=', 'base64');
  const shot = path.join(tmp, 'shot.png'); fs.writeFileSync(shot, png);
  const out = path.join(tmp, 'overlay.svg');
  run('overlay', example, shot, '-o', out);
  isXml(out);
  const s = fs.readFileSync(out, 'utf8');
  assert.match(s, /width="2" height="2"/);
  assert.match(s, /<image href="data:image\/png;base64,/);
  assert.doesNotMatch(s, /hatch1\)"/, 'overlay is wire only');
});

test('rejects a spec without the version tag', () => {
  const p = path.join(tmp, 'bad.json'); fs.writeFileSync(p, '{"canvas":{"w":1,"h":1}}');
  assert.throws(() => run('check', p), /spec-v2/);
});
