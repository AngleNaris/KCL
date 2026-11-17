import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateSpec, normalizeSpec, renderPlate, wireOverlay, checkStructure, resolveAnchor, subjectTransform, elementBox, LADDER } from '../kcl-render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const example = JSON.parse(fs.readFileSync(path.join(here, '../../examples/tide-heron.kcl-spec.json'), 'utf8'));
// A v1 twin of the shipped example: no weight/fill/ink, levels as strings.
const v1 = structuredClone(example); v1.kcl = 'spec-v1'; for (const el of v1.elements) { delete el.weight; delete el.fill; delete el.ink; if (el.levels) el.levels = el.levels.map((l) => l.mode); delete el.render; delete el.fit; }

test('migrate: v1 becomes v2 with explicit weight, fill and ink', () => {
  const v2 = migrateSpec(v1);
  assert.equal(v2.kcl, 'spec-v2'); assert.equal(v2.migratedFrom, 'spec-v1');
  const bar = v2.elements.find((e) => e.kind === 'bar'); assert.deepEqual([bar.weight, bar.fill, bar.ink], ['bar', 'solid', 'fg']);
  const lines = v2.elements.find((e) => e.kind === 'lines'); assert.equal(lines.weight, 'hairline');
  const sub = v2.elements.find((e) => e.kind === 'subject'); assert.equal(sub.render, 'reduced'); assert.equal(typeof sub.levels[0], 'object');
  assert.equal(v1.kcl, 'spec-v1', 'input untouched');
  assert.deepEqual(v2.elements.map((e) => [e.weight, e.fill, e.ink]), example.elements.map((e) => [e.weight, e.fill, e.ink]), 'migration reproduces the shipped v2 example');
});
test('migrate: rejects unknown format', () => { assert.throws(() => migrateSpec({ kcl: 'nope' }), /spec-v1/); });

test('normalize: anchors resolve to subject landmarks and along samples the flow', () => {
  const spec = { kcl: 'spec-v2', canvas: { w: 1000, h: 500 }, elements: [
    { id: 'hero', kind: 'subject', box: { x: 100, y: 100, w: 200, h: 300 }, fit: 'stretch', anatomy: { landmarks: { eye: [0.5, 0.25] }, centroid: [0.5, 0.6] }, levels: [] },
    { id: 'ring', kind: 'container', shape: 'circle', r: 50, anchor: { to: 'hero', at: 'eye', offset: [10, 0] } },
    { id: 'fam', kind: 'lines', angle: 30, count: 2, anchor: { to: 'hero', at: 'centroid' } },
    { id: 'trail', kind: 'trail', along: { from: 0, to: 1, samples: 4 }, count: 3 },
  ], flow: { entry: [0, 0], path: [[500, 250]], exit: [1000, 500] } };
  const n = normalizeSpec(spec);
  assert.deepEqual([n.elements[1].cx, n.elements[1].cy], [210, 175]);
  assert.deepEqual(n.elements[2].through, [200, 280]);
  assert.equal(n.elements[3].path.length, 5); assert.deepEqual(n.elements[3].path[0], [0, 0]); assert.deepEqual(n.elements[3].path[4], [1000, 500]);
});

test('subjectTransform: contain and cover honour the asset aspect', () => {
  const el = { box: { x: 0, y: 0, w: 100, h: 200 }, fit: 'contain', align: [0.5, 0.5] }; const T = subjectTransform(el, { w: 50, h: 50 });
  assert.equal(T.sx, 2); assert.equal(T.ty, 50);
  const C = subjectTransform({ ...el, fit: 'cover' }, { w: 50, h: 50 }); assert.equal(C.sx, 4);
  assert.deepEqual(resolveAnchor({ ...el, anatomy: { top: [0.5, 0] } }, 'top', { w: 50, h: 50 }), [50, 50]);
});

test('renderPlate: layered SVG, weights from the ladder, layer filter', () => {
  const svg = renderPlate(example, { id: 't' });
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  for (const l of ['ground', 'plane', 'subject', 'system', 'signal', 'type']) assert.match(svg, new RegExp(`data-layer="${l}"`));
  assert.match(svg, /data-kind="bar"/); assert.match(svg, /asset pending/, 'placeholder for subjects without assets');
  assert.doesNotMatch(svg, /NaN/);
  const k = Math.min(1440, 900) / 900; assert.match(svg, new RegExp(`stroke-width="${LADDER.weight.hairline * k}"`));
  const only = renderPlate(example, { id: 't', layers: ['ground', 'type'] });
  assert.doesNotMatch(only, /data-kind="bar"/); assert.match(only, /data-kind="type"/);
});

test('renderPlate: assets placed with contain transform and tinted line level', () => {
  const spec = { kcl: 'spec-v2', canvas: { w: 800, h: 800 }, elements: [{ id: 's', kind: 'subject', box: { x: 0, y: 0, w: 400, h: 400 }, fit: 'contain', levels: [{ src: 'a.png', mode: 'line', tint: 'signal', offset: [5, 5] }, { src: 'b.png', mode: 'rendered' }] }] };
  const svg = renderPlate(spec, { assets: { 'a.png': { w: 100, h: 200 }, 'b.png': { w: 100, h: 200 } }, resolve: (s) => `/file/${s}` });
  assert.match(svg, /href="\/file\/a.png"/); assert.match(svg, /translate\(105,5\) scale\(2,2\)/); assert.match(svg, /feFlood flood-color="#ff3b1f"/);
});

test('wireOverlay: flow with stations and subject landmarks', () => {
  const w = wireOverlay(example); assert.match(w, /data-layer="wire"/); assert.equal((w.match(/<circle[^>]*fill="#e3261a"/g) || []).length, example.flow.stations.length);
});

test('checkStructure: catches the starchild failure mode (all hairline, no solid plane, signal only on marks)', () => {
  const weak = { kcl: 'spec-v2', canvas: { w: 1600, h: 900 }, elements: [
    { kind: 'frame', x: 40, y: 40, w: 1500, h: 800, weight: 'hairline' }, { kind: 'container', shape: 'circle', cx: 1200, cy: 400, r: 300, weight: 'hairline', fill: 'outline' }, { kind: 'lines', angle: 18, count: 2, weight: 'hairline' },
    { kind: 'mark', shape: 'star', x: 100, y: 100, size: 12, ink: 'signal' }, { kind: 'subject', id: 'heir', box: { x: 800, y: 60, w: 800, h: 900 }, render: 'rendered', levels: [{ src: 'x.png', mode: 'rendered' }, { src: 'c.png', mode: 'line', opacity: 0.08, offset: [3, 2] }] }, { kind: 'soft', x: 900, y: 300, w: 300, h: 40, ink: 'fg' },
  ] };
  const r = checkStructure(weak); const text = r.warnings.join('\n');
  assert.match(text, /SKL-14 装置只有 2 个重量档/); assert.match(text, /没有实心的面/); assert.match(text, /COL-6 信号色只出现在标点上/); assert.match(text, /MAT-7 .*第二处理层不透明度/); assert.match(text, /MAT-7 已有保留原画材质的主体/); assert.match(text, /没有 line 以上重量的装置切过主体/);
  const strong = { ...weak, elements: [
    { kind: 'container', shape: 'circle', cx: 1200, cy: 400, r: 300, fill: 'solid', ink: 'signal2' }, { kind: 'rings', cx: 1200, cy: 400, radii: [340], weights: ['band'] }, { kind: 'bar', x: 0, y: 560, w: 1100, h: 24 }, { kind: 'lines', angle: 18, count: 2, weight: 'line', through: [1200, 400] },
    { kind: 'rule', x1: 80, y1: 640, x2: 640, y2: 640, ink: 'signal' }, { id: 'win', kind: 'container', shape: 'circle', cx: 1200, cy: 200, r: 120, hidden: true }, { kind: 'subject', id: 'heir', box: { x: 800, y: 60, w: 800, h: 900 }, render: 'rendered', levels: [{ src: 'x.png', mode: 'rendered', clip: 'win' }, { src: 'c.png', mode: 'line', opacity: 1, clip: 'win' }, { src: 'c.png', mode: 'threshold' }] }, { kind: 'trail', path: [[0, 0], [100, 100]], src: 'shard.png' },
  ] };
  assert.deepEqual(checkStructure(strong).warnings.filter((w) => !w.startsWith('SKL-16')), []);
  const shifted = { ...strong, elements: strong.elements.map((e) => (e.kind === 'subject' ? { ...e, levels: [{ src: 'x.png', mode: 'rendered' }, { src: 'c.png', mode: 'line', opacity: 1, offset: [24, 16] }] } : e)) };
  const st = checkStructure(shifted).warnings.join('\n'); assert.match(st, /MAT-7 .*平移了 29px（重影）/); assert.match(st, /MAT-7 .*整幅原画进入/);
  assert.match(checkStructure(strong).warnings.join('\n'), /SKL-16 没有有机面或纹理面/);
});

test('elementBox covers every geometry kind', () => {
  for (const el of normalizeSpec(example).elements) { const b = elementBox(el, 1440, 900); for (const v of [b.x, b.y, b.w, b.h]) assert.equal(Number.isFinite(v), true, `${el.kind} box`); }
});

test('checkStructure: richness families, fields and echoes (SKL-16)', () => {
  const els = [];
  els.push({ kind: 'bar', x: 0, y: 500, w: 900, h: 20 }, { kind: 'field', x: 0, y: 0, w: 300, h: 300, pattern: 'dots' }, { kind: 'lines', angle: 27, count: 3 }, { kind: 'rings', cx: 450, cy: 450, radii: [200], weights: ['band'] });
  els.push({ kind: 'glyphs', path: [[0, 0], [900, 900]], count: 9 }, { kind: 'type', role: 'plane', text: 'X', box: { x: 0, y: 0, w: 200, h: 200 } }, { kind: 'rule', x1: 0, y1: 10, x2: 300, y2: 10, ink: 'signal' });
  for (let i = 0; i < 6; i++) els.push({ kind: 'mark', shape: 'star', x: 100 + i * 50, y: 100, size: 14 });
  els.push({ id: 's', kind: 'subject', box: { x: 300, y: 100, w: 400, h: 600 }, levels: [{ src: 'a.png', mode: 'silhouette' }, { src: 'b.png', mode: 'line' }] });
  els.push({ id: 'echo', kind: 'subject', rank: 3, box: { x: 0, y: 600, w: 150, h: 250 }, levels: [{ src: 'a.png', mode: 'silhouette', mirror: true }] });
  while (els.length < 26) els.push({ kind: 'mark', shape: 'dot', x: 50, y: 50 + els.length * 10, size: 10 });
  const r = checkStructure({ kcl: 'spec-v2', canvas: { w: 900, h: 900 }, elements: els });
  assert.ok(r.richness.families.includes('field') && r.richness.echoes === 1 && r.richness.subjectLevels === 3, JSON.stringify(r.richness));
  assert.deepEqual(r.warnings.filter((w) => w.startsWith('SKL-16')), []);
  const svg = renderPlate({ kcl: 'spec-v2', canvas: { w: 900, h: 900 }, elements: els }, { assets: { 'a.png': { w: 100, h: 150 }, 'b.png': { w: 100, h: 150 } } });
  assert.match(svg, /<pattern id="p-field-\d+"/); assert.match(svg, /scale\(-1,1\)/, 'mirrored echo'); assert.doesNotMatch(svg, /NaN/);
});

test('anchored ticks, blob and system resolve their centre from the subject landmark', () => {
  const spec = { kcl: 'spec-v2', canvas: { w: 900, h: 900 }, elements: [
    { id: 's', kind: 'subject', box: { x: 300, y: 100, w: 300, h: 600 }, anatomy: { landmarks: { hands: [0.5, 0.5] } }, levels: [{ src: 'a.png', mode: 'threshold' }] },
    { id: 't', kind: 'ticks', anchor: { to: 's', at: 'hands' }, r: 100, count: 12 }, { id: 'b', kind: 'blob', anchor: { to: 's', at: 'hands' }, r: 30 }, { id: 'y', kind: 'system', anchor: { to: 's', at: 'hands' }, rx: 200, ry: 100, count: 8, shape: 'phase', phases: true } ] };
  const n = normalizeSpec(spec, { assets: { 'a.png': { w: 100, h: 200 } } });
  for (const id of ['t', 'b', 'y']) { const e = n.elements.find((x) => x.id === id); assert.ok(Number.isFinite(e.cx) && Number.isFinite(e.cy), id); }
  const svg = renderPlate(spec, { assets: { 'a.png': { w: 100, h: 200 } } }); assert.doesNotMatch(svg, /NaN/);
});

test('star marks are astroids with a cluster option (SKL-8/SKL-17)', () => {
  const spec = { kcl: 'spec-v2', canvas: { w: 900, h: 900 }, elements: [
    { id: 'a', kind: 'mark', shape: 'star', x: 450, y: 300, size: 200, outline: 'line', inner: 0.4, innerInk: 'signal', satellites: [[-0.5, -0.4, 0.2], [0.45, 0.35, 0.3]] },
    { id: 'b', kind: 'mark', shape: 'star', x: 100, y: 100, size: 40, straight: true } ] };
  const svg = renderPlate(spec, {});
  const paths = svg.match(/<path d="M[^"]+"/g) || [];
  assert.ok(paths.some((p) => p.includes('Q')), 'curved sides'); assert.ok(paths.some((p) => !p.includes('Q')), 'straight kept on request');
  assert.match(svg, /fill="none" stroke="/, 'outline body'); assert.doesNotMatch(svg, /NaN/);
  assert.equal((svg.match(/<path d="M/g) || []).length, 5, 'body + inner + 2 satellites + straight');
});

test('lineKinship: one centre, one axis; orphans, near-relations, free centres, gestures and the face (SKL-18)', () => {
  const base = { kcl: 'spec-v2', canvas: { w: 1600, h: 900 }, axis: 27, elements: [
    { id: 's', kind: 'subject', box: { x: 600, y: 100, w: 400, h: 700 }, anatomy: { centroid: [0.5, 0.55], landmarks: { eyes: [0.5, 0.15], collar: [0.5, 0.35] } }, levels: [{ src: 'a.png', mode: 'threshold' }] },
    { id: 'fam', kind: 'lines', angle: 'axis', count: 3, perp: 1, anchor: { to: 's', at: 'collar' } },
    { id: 'rings', kind: 'rings', anchor: { to: 's', at: 'collar' }, radii: [200, 260], weights: ['line', 'band'] },
    { id: 'fan', kind: 'ticks', anchor: { to: 's', at: 'collar' }, r: 300, count: 24 },
    { id: 'orb', kind: 'orbit', anchor: { to: 's', at: 'collar', offset: [0, 40] }, rx: 500, ry: 220, tilt: 'axis' },
    { id: 'tan', kind: 'line', tangent: { r: 260, at: 'perp' }, anchor: { to: 's', at: 'collar' } },
    { id: 'rad', kind: 'line', radial: { at: 'axis', from: 300, to: 900 }, anchor: { to: 's', at: 'collar' } },
    { id: 'sw', kind: 'sweep', path: [[100, 700], [500, 560], [900, 320]], ink: 'signal', width: 20 },
    { id: 'frag', kind: 'trail', path: [[100, 700], [500, 560], [900, 320]], src: 'x.png' },
    { id: 'hz', kind: 'horizon', y: 0.62 } ] };
  const n = normalizeSpec(base, { assets: { 'a.png': { w: 100, h: 175 } } });
  const fam = n.elements.find((e) => e.id === 'fam'), orb = n.elements.find((e) => e.id === 'orb'), tan = n.elements.find((e) => e.id === 'tan'), rad = n.elements.find((e) => e.id === 'rad');
  assert.equal(fam.angle, 27); assert.equal(orb.tilt, -27);
  for (const e of [tan, rad]) for (const v of [e.x1, e.y1, e.x2, e.y2]) assert.ok(Number.isFinite(v), `${e.id} resolved`);
  const c = [rad.cx, rad.cy]; const a = 27 * Math.PI / 180; assert.ok(Math.abs((rad.x1 - c[0]) - 300 * Math.cos(a)) < 1e-6 && Math.abs((rad.y1 - c[1]) + 300 * Math.sin(a)) < 1e-6, 'radial starts on the circle at the axis angle');
  const tanMid = [(tan.x1 + tan.x2) / 2, (tan.y1 + tan.y2) / 2]; assert.ok(Math.abs(Math.hypot(tanMid[0] - c[0], tanMid[1] - c[1]) - 260) < 1e-6, 'tangent touches the ring');
  const r = checkStructure(n, { assets: { 'a.png': { w: 100, h: 175 } } });
  assert.equal(r.kinship.axis, 27); assert.equal(r.kinship.gestures.length, 1, 'sweep and trail on the same path are one gesture');
  assert.ok(r.kinship.centres.every((cl) => cl.on), JSON.stringify(r.kinship.centres));
  assert.deepEqual(r.warnings.filter((w) => w.startsWith('SKL-18') || /穿过面部/.test(w) || w.startsWith('TYP-1')), []);
  const messy = { ...base, elements: [...base.elements,
    { id: 'stray', kind: 'line', x1: 0, y1: 100, x2: 1600, y2: 300 }, { id: 'near', kind: 'lines', angle: 34, count: 1 },
    { id: 'free', kind: 'orbit', cx: 200, cy: 700, rx: 300, ry: 100, tilt: 30 }, { id: 'sw2', kind: 'sweep', path: [[1500, 100], [1200, 500], [1500, 800]], ink: 'signal' },
    { id: 'face', kind: 'lines', angle: 0, count: 1, through: [800, 205] }, { id: 'ttl', kind: 'type', role: 'plane', text: 'X', box: { x: 600, y: 150, w: 400, h: 120 } } ] };
  const t = checkStructure(messy, { assets: { 'a.png': { w: 100, h: 175 } } }).warnings.join('\n');
  assert.match(t, /SKL-18 .*斜线家族/); assert.match(t, /SKL-18 线族 27°（fam\/tan\/rad）与线族 34°（near）只差 7°/); assert.match(t, /SKL-18 弧心 \(200, 700\) \[free\]/); assert.match(t, /SKL-18 椭圆倾角 free/); assert.match(t, /SKL-18 2 条自由曲线/); assert.match(t, /SKL-3 face 穿过面部/); assert.match(t, /TYP-1 字面 ttl 压在面部上/);
  const mirror = { ...base, elements: base.elements.filter((e) => e.id !== 'fam').concat([{ id: 'x1', kind: 'line', x1: 0, y1: 900, x2: 1600, y2: 85 }, { id: 'x2', kind: 'line', x1: 1600, y1: 900, x2: 0, y2: 85 }]) };
  const m = checkStructure(mirror, { assets: { 'a.png': { w: 100, h: 175 } } }); assert.ok(m.kinship.families.some((f) => f.mirror), 'a mirrored pair is kin'); assert.doesNotMatch(m.warnings.join('\n'), /斜线家族/);
});
