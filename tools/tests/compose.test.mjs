import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.join(here, '..', 'compose.mjs');
const run = (...a) => execFileSync('node', [bin, ...a], { encoding: 'utf8' });

test('lines exit the canvas on both ends', () => {
  const out = run('lines', '--angle', '27', '--count', '3', '--box', '1440x900');
  const coords = [...out.matchAll(/x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/g)];
  assert.ok(coords.length >= 3);
  for (const [, x1, y1, x2, y2] of coords) {
    const outside = (x, y) => x < 0 || y < 0 || x > 1440 || y > 900;
    assert.ok(outside(+x1, +y1) && outside(+x2, +y2), 'endpoint inside canvas');
  }
});

test('dots step by ratio and never repeat a size', () => {
  const out = run('dots', '--count', '6', '--ratio', '1.5', '--start', '4');
  const radii = [...out.matchAll(/r="([\d.]+)"/g)].map((m) => +m[1]);
  assert.equal(radii.length, 6);
  for (let i = 1; i < radii.length; i++) assert.ok(radii[i] > radii[i - 1]);
});

test('every command returns an svg group', () => {
  for (const c of ['stars', 'radial', 'rings', 'orbit', 'ridge', 'flock', 'contours']) {
    assert.match(run(c), /^<g /);
  }
  assert.match(run('rings', '--full', '100x100'), /^<svg /);
});

test('seeded commands are deterministic', () => {
  assert.equal(run('ridge', '--seed', '9'), run('ridge', '--seed', '9'));
  assert.notEqual(run('flock', '--seed', '1'), run('flock', '--seed', '2'));
});

test('contours close without a seam', () => {
  const out = run('contours', '--count', '3', '--samples', '120', '--amp', '0.3');
  for (const m of out.matchAll(/d="M([\d.-]+),([\d.-]+) L(.*?) Z"/g)) {
    const pts = m[3].split(' L').map((p) => p.split(',').map(Number));
    const [x0, y0] = [+m[1], +m[2]];
    const [xl, yl] = pts[pts.length - 1];
    const [x1, y1] = pts[0];
    const step = Math.hypot(x1 - x0, y1 - y0);
    const close = Math.hypot(x0 - xl, y0 - yl);
    assert.ok(close < step * 3, `seam: closing gap ${close} vs step ${step}`);
  }
});

test('--indexed numbers every child for staggered motion', () => {
  const out = run('dots', '--count', '4', '--indexed');
  const idx = [...out.matchAll(/style="--i:(\d+)"/g)].map((m) => +m[1]);
  assert.deepEqual(idx, [0, 1, 2, 3]);
});
