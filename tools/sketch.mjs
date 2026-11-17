#!/usr/bin/env node
// KCL sketch: turn a composition spec (kcl-spec.json) into a wireframe for approval, check its
// numbers, lay candidates side by side, or overlay the locked skeleton and flow on a screenshot.
// Usage:
//   node sketch.mjs render spec.json [-o out.svg] [--grid] [--no-flow] [--scale 1]
//   node sketch.mjs sheet a.json b.json [c.json] [-o sheet.svg]
//   node sketch.mjs overlay spec.json shot.png [-o overlay.svg]
//   node sketch.mjs check spec.json [--json]
// No dependencies. Coordinates in the spec are canvas pixels; horizon.y may be a 0–1 fraction.

import fs from 'node:fs';
import path from 'node:path';
import { starPath } from './kcl-render.mjs';

const [, , cmd, ...rest] = process.argv;
const args = {}; const positional = [];
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a === '-o') { args.out = rest[++i]; continue; }
  if (a.startsWith('--')) { const k = a.slice(2); const n = rest[i + 1]; if (n === undefined || n.startsWith('-')) args[k] = true; else { args[k] = n; i++; } }
  else positional.push(a);
}
const f = (n) => Number(Number(n).toFixed(2));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT = "'Noto Sans CJK SC','Noto Serif CJK SC','Noto Sans SC','DejaVu Sans',Arial,sans-serif";
const MONO = "'DejaVu Sans Mono','Noto Sans Mono CJK SC',monospace";
const C = { paper: '#f2f1ec', ink: '#1b1b1b', ghost: '#8e8e86', faint: '#d4d3cc', flow: '#e3261a', quiet: '#5b7fa6' };

function loadSpec(file) {
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (spec.kcl !== 'spec-v1' && spec.kcl !== 'spec-v2') throw new Error(`${file}: expected "kcl": "spec-v2"`);
  if (!spec.canvas || !spec.canvas.w || !spec.canvas.h) throw new Error(`${file}: canvas.w and canvas.h are required`);
  spec.elements = spec.elements || [];
  spec.__file = file;
  return spec;
}
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- geometry helpers ----------
function polyLength(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function alongPoly(pts, u) { // point at fraction u of a polyline
  const total = polyLength(pts); let d = u * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= seg || i === pts.length - 1) { const t = seg === 0 ? 0 : Math.min(1, d / seg); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
    d -= seg;
  }
  return [...pts[0], 0];
}
function smoothPath(pts) { // Catmull-Rom through points as cubic beziers
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M${f(pts[0][0])},${f(pts[0][1])} L${f(pts[1][0])},${f(pts[1][1])}`;
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}
function sampleSmooth(pts, n = 64) { // sample the Catmull-Rom curve for checks
  if (pts.length < 3) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 0; k < n; k++) { const t = k / n, mt = 1 - t; out.push([mt ** 3 * p1[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * p2[0], mt ** 3 * p1[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * p2[1]]); }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function lineFamily(el, W, H) { // same placement as compose.mjs lines: one angle family, optional perpendiculars
  const angle = (el.angle ?? 27) * Math.PI / 180, count = el.count ?? 3, perp = el.perp ?? 0;
  const dir = { x: Math.cos(angle), y: -Math.sin(angle) }, nrm = { x: -dir.y, y: dir.x };
  const L = Math.hypot(W, H) * 1.6, cx = el.through ? el.through[0] : W / 2, cy = el.through ? el.through[1] : H / 2;
  const span = Math.abs(W * nrm.x) + Math.abs(H * nrm.y), pspan = Math.abs(W * dir.x) + Math.abs(H * dir.y);
  const out = [];
  for (let k = 0; k < count; k++) { const o = count === 1 ? 0 : (k / (count - 1) - 0.5) * span * (el.spread ?? 0.78); const px = cx + nrm.x * o, py = cy + nrm.y * o; out.push([px - dir.x * L / 2, py - dir.y * L / 2, px + dir.x * L / 2, py + dir.y * L / 2]); }
  for (let k = 0; k < perp; k++) { const o = perp === 1 ? -span * 0.12 : (k / (perp - 1) - 0.5) * pspan * 0.5; const px = cx + dir.x * o, py = cy + dir.y * o; out.push([px - nrm.x * L / 2, py - nrm.y * L / 2, px + nrm.x * L / 2, py + nrm.y * L / 2]); }
  return out;
}
function extendLine(x1, y1, x2, y2, W, H) { const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(W, H) * 1.6 / Math.hypot(dx, dy); return [x1 - dx * L, y1 - dy * L, x2 + dx * L, y2 + dy * L]; }
function segRect(x1, y1, x2, y2, b) { // segment intersects rect (Liang–Barsky)
  let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
  for (const [p, q] of [[-dx, x1 - b.x], [dx, b.x + b.w - x1], [-dy, y1 - b.y], [dy, b.y + b.h - y1]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return true;
}
function circleRect(cx, cy, r, b) { // circle outline crosses the rect
  const near = Math.hypot(Math.max(b.x - cx, 0, cx - b.x - b.w), Math.max(b.y - cy, 0, cy - b.y - b.h));
  const far = Math.max(...[[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map(([x, y]) => Math.hypot(x - cx, y - cy)));
  return near <= r && far >= r;
}
const horizonY = (el, H) => (el.y <= 1 ? el.y * H : el.y);
const boxOf = (el) => el.box || (el.r !== undefined ? { x: el.cx - el.r, y: el.cy - el.r, w: el.r * 2, h: el.r * 2 } : { x: el.x, y: el.y, w: el.w, h: el.h });

// ---------- rendering of one canvas ----------
const LAYER_ORDER = ['plane', 'subject', 'system', 'fragment', 'signal', 'type', 'quiet'];
function layerOf(el) {
  if (el.layer) return el.layer;
  return ({ bar: 'plane', block: 'plane', frame: 'plane', container: 'plane', subject: 'subject', lines: 'system', line: 'system', horizon: 'system', rings: 'system', radial: 'system', orbit: 'system', rhythm: 'system', trail: 'fragment', mark: 'signal', soft: 'signal', rule: 'signal', type: 'type', quiet: 'quiet' })[el.kind] || 'system';
}

function renderCanvas(spec, opt = {}) {
  const { w: W, h: H } = spec.canvas; const signal = spec.color?.signal || '#1e4fd8';
  const id = opt.id || 'k'; const out = [];
  const wire = !!opt.wire; // overlay mode: outlines only, no fills or labels
  const els = [...spec.elements].sort((a, b) => LAYER_ORDER.indexOf(layerOf(a)) - LAYER_ORDER.indexOf(layerOf(b)));
  const label = (x, y, text, size = 13, color = C.ink) => wire ? '' : `<text x="${f(x)}" y="${f(y)}" font-family="${FONT}" font-size="${size}" fill="${color}" stroke="#ffffff" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(text)}</text>`;
  const tag = (x, y, text, size = 12) => wire ? '' : `<g><rect x="${f(x)}" y="${f(y - size - 3)}" width="${f(text.length * size * 0.62 + 10)}" height="${size + 7}" fill="${C.paper}" stroke="${C.ink}" stroke-width="0.8"/>${label(x + 5, y, text, size)}</g>`;

  if (!wire) {
    out.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${C.paper}"/>`);
    if (opt.grid) { const cols = 12, m = W * 0.04, g = W * 0.02, cw = (W - 2 * m - g * (cols - 1)) / cols; for (let i = 0; i < cols; i++) out.push(`<rect x="${f(m + i * (cw + g))}" y="0" width="${f(cw)}" height="${H}" fill="${C.faint}" opacity="0.35"/>`); }
    for (const b of spec.canvas.bands || []) { out.push(`<line x1="0" y1="${b.y}" x2="${W}" y2="${b.y}" stroke="${C.ghost}" stroke-dasharray="6 6"/>`); out.push(label(12, b.y + 20, `band ${b.id || ''} ${b.label || ''}`.trim(), 14, C.ghost)); }
  }
  for (const el of els) {
    const k = el.kind;
    if (k === 'bar') out.push(`<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" fill="${wire ? 'none' : C.ink}" stroke="${C.ink}" opacity="${wire ? 0.9 : 0.88}"/>`);
    else if (k === 'block') out.push(`<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" fill="${wire ? 'none' : C.ink}" stroke="${C.ink}" opacity="${wire ? 0.9 : 0.3}"/>${label(el.x + 8, el.y + 18, el.label || '面', 12)}`);
    else if (k === 'frame') out.push(`<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`);
    else if (k === 'container') {
      if (el.shape === 'circle' || el.r !== undefined) out.push(`<circle cx="${f(el.cx)}" cy="${f(el.cy)}" r="${f(el.r)}" fill="none" stroke="${C.ink}" stroke-width="2"/>${label(el.cx - el.r + 10, el.cy - el.r + 22, el.label || '容器', 12)}`);
      else if (el.shape === 'arch') out.push(`<path d="M${f(el.x)},${f(el.y + el.h)} V${f(el.y + el.w / 2)} A${f(el.w / 2)},${f(el.w / 2)} 0 0 1 ${f(el.x + el.w)},${f(el.y + el.w / 2)} V${f(el.y + el.h)}" fill="none" stroke="${C.ink}" stroke-width="2"/>${label(el.x + 10, el.y + el.h - 10, el.label || '容器', 12)}`);
      else out.push(`<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" fill="none" stroke="${C.ink}" stroke-width="2"/>${label(el.x + 10, el.y + 22, el.label || '容器', 12)}`);
    } else if (k === 'subject') {
      const b = el.box, rank = el.rank || 1, pat = `url(#${id}-hatch${Math.min(rank, 3)})`;
      const body = `<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="${wire ? 'none' : pat}" stroke="${C.ink}" stroke-width="${rank === 1 ? 2 : 1.2}"/>`;
      if (wire) out.push(body);
      else {
        out.push(`<g clip-path="url(#${id}-canvas)">${body}</g><g clip-path="url(#${id}-bleed)" opacity="0.3">${body}</g>`);
        const text = `${['①', '②', '③', '④'][rank - 1] || rank} ${el.label || el.id || 'subject'}${el.levels ? ' · ' + [].concat(el.levels).map((l) => (typeof l === 'string' ? l : l.mode || l.src || '')).join('+') : ''}`;
        out.push(tag(Math.max(b.x, 0) + 8, Math.max(b.y, 0) + 24, text, 13));
        for (const edge of el.bleed || []) { const e = { left: [0, b.y, 0, b.y + b.h], right: [W, b.y, W, b.y + b.h], top: [b.x, 0, b.x + b.w, 0], bottom: [b.x, H, b.x + b.w, H] }[edge]; if (e) out.push(`<line x1="${f(Math.max(0, e[0]))}" y1="${f(Math.max(0, e[1]))}" x2="${f(Math.min(W, e[2]))}" y2="${f(Math.min(H, e[3]))}" stroke="${C.ink}" stroke-width="6" opacity="0.6"/>`); }
      }
    } else if (k === 'lines') for (const [x1, y1, x2, y2] of lineFamily(el, W, H)) out.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${C.ink}" stroke-width="0.8" opacity="0.7"${el.dash ? ' stroke-dasharray="3 7"' : ''}/>`);
    else if (k === 'line') { const [x1, y1, x2, y2] = el.extend === false ? [el.x1, el.y1, el.x2, el.y2] : extendLine(el.x1, el.y1, el.x2, el.y2, W, H); out.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${C.ink}" stroke-width="0.8" opacity="0.7"${el.dash ? ' stroke-dasharray="3 7"' : ''}/>`); }
    else if (k === 'horizon') { const y = horizonY(el, H); out.push(`<line x1="-40" y1="${f(y)}" x2="${W + 40}" y2="${f(y)}" stroke="${C.ink}" stroke-width="0.8" stroke-dasharray="2 6" opacity="0.8"/>${label(W - 90, y - 6, `horizon ${el.y <= 1 ? el.y : f(y / H)}`, 11)}`); }
    else if (k === 'rings') for (const r of el.radii || []) out.push(`<circle cx="${f(el.cx)}" cy="${f(el.cy)}" r="${f(r)}" fill="none" stroke="${C.ink}" stroke-width="0.8" opacity="0.7"${el.dash ? ' stroke-dasharray="2 6"' : ''}/>`);
    else if (k === 'radial') { const n = el.count || 48; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; out.push(`<line x1="${f(el.cx + el.inner * Math.cos(a))}" y1="${f(el.cy + el.inner * Math.sin(a))}" x2="${f(el.cx + el.outer * Math.cos(a))}" y2="${f(el.cy + el.outer * Math.sin(a))}" stroke="${C.ink}" stroke-width="0.6" opacity="0.6"/>`); } }
    else if (k === 'orbit') out.push(`<ellipse cx="${f(el.cx)}" cy="${f(el.cy)}" rx="${f(el.rx)}" ry="${f(el.ry)}" transform="rotate(${el.tilt || 0} ${f(el.cx)} ${f(el.cy)})" fill="none" stroke="${C.ink}" stroke-width="0.8" opacity="0.7"/>`);
    else if (k === 'rhythm') { const n = el.count || 6, ratio = el.ratio || 1.5, start = el.start || 4, r = rng(el.seed || 7); const ts = [0]; const steps = []; for (let i = 0; i < n - 1; i++) steps.push(1 + (r() - 0.5) * 0.5); const tot = steps.reduce((a, b) => a + b, 0); let t = 0; for (const s of steps) { t += s / tot; ts.push(t); } ts.forEach((u, i) => { const [x, y] = alongPoly(el.path, u); const rr = start * Math.pow(ratio, el.reverse ? n - 1 - i : i); out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${C.ink}"/>`); }); if (!wire) { const [x, y] = alongPoly(el.path, 0); out.push(label(x + 8, y - 8, `节奏 ×${n} ·${ratio}`, 11)); } }
    else if (k === 'trail') { const n = el.count || 8, r = rng(el.seed || 3), [s0, s1] = el.size || [6, 24], taper = el.taper || 'away'; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; const [x, y, a] = alongPoly(el.path, u); const g = taper === 'away' ? 1 - u : taper === 'toward' ? u : 0.5; const s = s0 + (s1 - s0) * Math.pow(g, 1.2); const jx = (r() - 0.5) * (el.spread || 40), jy = (r() - 0.5) * (el.spread || 40) * 0.6; out.push(`<rect x="${f(x + jx - s / 2)}" y="${f(y + jy - s / 5)}" width="${f(s)}" height="${f(s / 2.5)}" transform="rotate(${f(a * 180 / Math.PI + (r() - 0.5) * 50)} ${f(x + jx)} ${f(y + jy)})" fill="${C.ink}" opacity="${wire ? 0.9 : 0.75}"/>`); } if (!wire) { const [x, y] = alongPoly(el.path, 0); out.push(label(x, y - 10, `碎片 ${el.label || el.id || ''} ×${n}`, 11)); } }
    else if (k === 'mark') { const s = el.size || 16; if (el.shape === 'dot') out.push(`<circle cx="${f(el.x)}" cy="${f(el.y)}" r="${f(s / 2)}" fill="${signal}"/>`); else if (el.shape === 'cross') out.push(`<path d="M${f(el.x - s / 2)},${f(el.y)} H${f(el.x + s / 2)} M${f(el.x)},${f(el.y - s / 2)} V${f(el.y + s / 2)}" stroke="${signal}" stroke-width="2"/>`); else out.push(`<path d="${starPath(el.x, el.y, s, el.sharp)}" fill="${signal}"/>`); }
    else if (k === 'soft') out.push(`<ellipse cx="${f(el.x + el.w / 2)}" cy="${f(el.y + el.h / 2)}" rx="${f(el.w / 2)}" ry="${f(el.h / 2)}" transform="rotate(${el.angle || 0} ${f(el.x + el.w / 2)} ${f(el.y + el.h / 2)})" fill="${signal}" opacity="0.85"${wire ? ' fill-opacity="0.2" stroke="' + signal + '"' : ` filter="url(#${id}-soft)"`}/>${label(el.x, el.y - 6, '软元素 ×1', 11)}`);
    else if (k === 'rule') out.push(`<line x1="${f(el.x1)}" y1="${f(el.y1)}" x2="${f(el.x2)}" y2="${f(el.y2)}" stroke="${signal}" stroke-width="${el.width || 3}"/>`);
    else if (k === 'type') {
      const b = el.box, role = el.role || 'voice', badge = { plane: 'P 字作面', mark: 'M 标记', voice: 'V 声部' }[role] || role;
      out.push(`<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="${role === 'plane' ? '10 6' : '4 4'}"/>`);
      if (wire) continue;
      if (role === 'plane') { const vert = el.orientation === 'vertical'; const text = String(el.text || 'PLANE'); const size = vert ? Math.min(b.w * 1.1, b.h / text.length * 1.3) : Math.min(b.h * 1.05, (b.w / Math.max(text.length, 1)) * 1.7); out.push(`<text x="${f(b.x + b.w / 2)}" y="${f(b.y + b.h / 2)}" font-family="Georgia,'Noto Serif CJK SC',serif" font-weight="700" font-size="${f(size)}" fill="${C.ink}" opacity="0.14" text-anchor="middle" dominant-baseline="central"${vert ? ` writing-mode="tb" style="writing-mode:vertical-rl"` : ''}>${esc(text)}</text>`); }
      else if (role === 'mark') out.push(`<text x="${f(b.x + 4)}" y="${f(b.y + b.h / 2 + 4)}" font-family="${MONO}" font-size="10" letter-spacing="2" fill="${C.ink}">${esc(String(el.text || 'MARK').toUpperCase())}</text>`);
      else { const lines = [].concat(el.text || '声部句'); lines.forEach((t, i) => out.push(`<text x="${f(b.x + 8)}" y="${f(b.y + 22 + i * 22)}" font-family="${FONT}" font-size="15" fill="${C.ink}">${esc(t)}</text>`)); }
      out.push(tag(b.x, b.y - 4, badge, 10));
    } else if (k === 'quiet') { const b = el.box; out.push(`<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="6" fill="${wire ? 'none' : C.quiet}" fill-opacity="0.07" stroke="${C.quiet}" stroke-dasharray="8 5"/>${label(b.x + b.w - 44, b.y + b.h - 8, '静区', 11, C.quiet)}`); }
  }
  // Flow (动线) on top: entry square, arrows along the path, numbered stations, exit arrow.
  const flow = spec.flow;
  if (flow && flow.path && !opt.noFlow) {
    const pts = [flow.entry, ...flow.path, flow.exit].filter(Boolean);
    const draw = (p, dash, width) => `<path d="${smoothPath(p)}" fill="none" stroke="${C.flow}" stroke-width="${width}" stroke-linecap="round"${dash ? ' stroke-dasharray="10 8"' : ''} marker-start="url(#${id}-entry)" marker-mid="url(#${id}-arrow)" marker-end="url(#${id}-arrow)"/>`;
    out.push(`<g opacity="0.92">${draw(pts, false, 3)}`);
    if (flow.secondary && flow.secondary.path) out.push(draw(flow.secondary.path, true, 2));
    (flow.stations || []).forEach((s, i) => { const [x, y] = s.at; out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="13" fill="${C.flow}"/><text x="${f(x)}" y="${f(y + 5)}" font-family="${FONT}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">${i + 1}</text>`); if (!wire && s.label) out.push(`<text x="${f(x + 18)}" y="${f(y + 5)}" font-family="${FONT}" font-size="12" fill="${C.flow}" stroke="#ffffff" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(s.label)}</text>`); });
    out.push('</g>');
  }
  return out.join('\n');
}
function defs(id, W, H, bleedPad) {
  return `<defs>
  <pattern id="${id}-hatch1" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${C.ink}" stroke-width="2"/></pattern>
  <pattern id="${id}-hatch2" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="${C.ink}" stroke-width="1.4"/></pattern>
  <pattern id="${id}-hatch3" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="16" stroke="${C.ink}" stroke-width="1"/></pattern>
  <clipPath id="${id}-canvas"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
  <clipPath id="${id}-all"><rect x="${-bleedPad}" y="${-bleedPad}" width="${W + 2 * bleedPad}" height="${H + 2 * bleedPad}"/></clipPath>
  <clipPath id="${id}-bleed"><path d="M${-bleedPad},${-bleedPad} H${W + bleedPad} V${H + bleedPad} H${-bleedPad} Z M0,0 V${H} H${W} V0 Z" clip-rule="evenodd"/></clipPath>
  <filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  <marker id="${id}-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="${C.flow}"/></marker>
  <marker id="${id}-entry" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6"><rect x="1" y="1" width="8" height="8" fill="none" stroke="${C.flow}" stroke-width="2"/></marker>
</defs>`;
}
function legendLines(spec, checks) {
  const p = spec.principles || {}, im = spec.imagery || {}, col = spec.color || {};
  const L = [];
  L.push([`${spec.title || path.basename(spec.__file || 'spec')}`, 20, 700]);
  if (im.tension) L.push([`张力 ${im.tension}`, 14, 400]);
  L.push([[`版式 ${spec.archetype || '—'}`, `配重 ${p.balance || '—'}`, `动线 ${spec.flow?.type || '—'}`, `色 ${col.mode || '—'} ${col.signal || ''}`, `画布 ${spec.canvas.w}×${spec.canvas.h}`].join('   ·   '), 13, 400]);
  if (p.hierarchy?.ranks) L.push([`层级 ${p.hierarchy.ranks.map((r, i) => `${i + 1} ${r.id || r}${r.role ? '(' + r.role + ')' : ''}`).join(' > ')}${p.hierarchy.dimensions ? '   维度 ' + p.hierarchy.dimensions.join('/') : ''}`, 13, 400]);
  if (p.repetition) L.push([`重复 ${[].concat(p.repetition).map((r) => typeof r === 'string' ? r : `${r.what}×${r.count || '?'}${r.variation ? ' ' + r.variation : ''}`).join('；')}`, 13, 400]);
  if (p.whitespace) L.push([`留白 目标 ${p.whitespace.target ?? '—'}${checks ? ' · 草图估算 ' + checks.whitespace : ''}${p.whitespace.narrative ? ' · 叙事留白 ' + p.whitespace.narrative : ''}`, 13, 400]);
  if (checks && checks.warnings.length) L.push([`检查 ${checks.warnings.join('；')}`, 12, 400, C.flow]);
  return L;
}
function renderDocument(spec, opt = {}) {
  const { w: W, h: H } = spec.canvas; const scale = Number(opt.scale || 1); const pad = Math.round(Math.max(W, H) * 0.06);
  const checks = opt.legend === false ? null : check(spec);
  const lines = opt.legend === false ? [] : legendLines(spec, checks);
  const legendH = lines.reduce((a, l) => a + l[1] + 10, 0) + (lines.length ? 24 : 0);
  const id = opt.id || 'k'; const totalW = (W + pad * 2) * scale, totalH = (H + pad * 2) * scale + legendH;
  let y = (H + pad * 2) * scale + 10;
  const legend = lines.map(([t, size, weight, color]) => { y += size + 10; return `<text x="${pad * scale}" y="${y - 8}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color || C.ink}">${esc(t)}</text>`; }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(totalW)}" height="${f(totalH)}" viewBox="0 0 ${f(totalW)} ${f(totalH)}">
<rect width="100%" height="100%" fill="#ffffff"/>
${defs(id, W, H, pad)}
<g transform="translate(${pad * scale},${pad * scale}) scale(${scale})">
<rect x="${-pad}" y="${-pad}" width="${W + 2 * pad}" height="${H + 2 * pad}" fill="#e9e8e2"/>
<g clip-path="url(#${id}-all)">${renderCanvas(spec, { ...opt, id })}</g>
<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${C.ink}" stroke-width="2"/>
<text x="0" y="-10" font-family="${MONO}" font-size="12" fill="${C.ghost}">0,0</text><text x="${W}" y="${H + 20}" font-family="${MONO}" font-size="12" fill="${C.ghost}" text-anchor="end">${W},${H}</text>
</g>
${legend}
</svg>`;
}
function renderSheet(specs, opt = {}) {
  const scale = Number(opt.scale || 0.5); const gap = 40; let x = gap; const parts = []; let maxH = 0;
  specs.forEach((spec, i) => {
    const { w: W, h: H } = spec.canvas; const pad = Math.round(Math.max(W, H) * 0.06); const id = `s${i}`;
    const checks = check(spec); const lines = legendLines(spec, checks);
    const w = (W + pad * 2) * scale, h = (H + pad * 2) * scale + lines.length * 20 + 50; maxH = Math.max(maxH, h);
    let ly = (H + pad * 2) * scale + 46;
    parts.push(`<g transform="translate(${x},${gap})">${defs(id, W, H, pad)}<text x="0" y="-10" font-family="${FONT}" font-size="26" font-weight="700" fill="${C.ink}">${String.fromCharCode(65 + i)}</text>
<g transform="scale(${scale})"><rect x="0" y="0" width="${W + 2 * pad}" height="${H + 2 * pad}" fill="#e9e8e2"/><g transform="translate(${pad},${pad})"><g clip-path="url(#${id}-all)">${renderCanvas(spec, { ...opt, id })}</g><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${C.ink}" stroke-width="2"/></g></g>
${lines.map(([t, size, weight, color]) => { ly += 20; return `<text x="0" y="${ly - 20}" font-family="${FONT}" font-size="${Math.min(size, 14)}" font-weight="${weight}" fill="${color || C.ink}">${esc(t)}</text>`; }).join('\n')}</g>`);
    x += w + gap;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(x)}" height="${f(maxH + gap * 2)}" viewBox="0 0 ${f(x)} ${f(maxH + gap * 2)}"><rect width="100%" height="100%" fill="#ffffff"/>${parts.join('\n')}</svg>`;
}
function pngSize(file) { const b = fs.readFileSync(file); if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file}: not a PNG`); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), data: b.toString('base64') }; }
function renderOverlay(spec, pngFile) {
  const img = pngSize(pngFile); const { w: W, h: H } = spec.canvas; const s = img.w / W;
  const id = 'o';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${img.w}" height="${img.h}" viewBox="0 0 ${img.w} ${img.h}">
${defs(id, W, H, 0)}
<image href="data:image/png;base64,${img.data}" x="0" y="0" width="${img.w}" height="${img.h}"/>
<g transform="scale(${Number(s.toFixed(5))})" opacity="0.9" clip-path="url(#${id}-all)">${renderCanvas(spec, { id, wire: true })}</g>
<text x="16" y="${img.h - 16}" font-family="${FONT}" font-size="${Math.round(14 * s)}" fill="${C.flow}">sketch overlay · ${esc(spec.title || '')}</text>
</svg>`;
}

// ---------- check: diagnostics against the recorded principles ----------
function check(spec) {
  const { w: W, h: H } = spec.canvas; const els = spec.elements; const warn = [];
  const subjects = els.filter((e) => e.kind === 'subject');
  const bands = spec.canvas.bands && spec.canvas.bands.length ? spec.canvas.bands : [{ id: 'stage', y: 0, h: H }];
  // Coverage on a coarse raster: subjects, bars, blocks, type boxes, soft element.
  const G = 4, cols = Math.ceil(W / G), rows = Math.ceil(H / G); const grid = new Uint8Array(cols * rows);
  const fill = (b) => { const x0 = Math.max(0, Math.floor(b.x / G)), y0 = Math.max(0, Math.floor(b.y / G)), x1 = Math.min(cols, Math.ceil((b.x + b.w) / G)), y1 = Math.min(rows, Math.ceil((b.y + b.h) / G)); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) grid[y * cols + x] = 1; };
  for (const e of els) { if (e.kind === 'subject' || e.kind === 'type') fill(e.box); else if (e.kind === 'bar' || e.kind === 'block' || e.kind === 'soft') fill(e); }
  let covered = 0; for (const v of grid) covered += v; const whitespace = f(1 - covered / grid.length);
  const target = spec.principles?.whitespace?.target; if (target !== undefined && Math.abs(whitespace - target) > 0.12) warn.push(`留白估算 ${whitespace} 偏离目标 ${target}`);
  // Scale pair: largest subject long side vs smallest meaningful mark/fragment/rhythm point.
  const largest = Math.max(0, ...subjects.map((s) => Math.max(s.box.w, s.box.h)));
  const smalls = [];
  for (const e of els) { if (e.kind === 'mark') smalls.push(e.size || 16); if (e.kind === 'trail') smalls.push((e.size || [6, 24])[0]); if (e.kind === 'rhythm') smalls.push((e.start || 4) * 2); }
  const smallest = smalls.length ? Math.min(...smalls) : null; const scaleRatio = smallest ? f(largest / smallest) : null;
  if (!subjects.length) warn.push('没有主体'); if (scaleRatio !== null && scaleRatio < 12) warn.push(`尺度差 1:${scaleRatio} 小于 1:12`);
  // Flow reaches the ranked subjects; apparatus passes through the first subject.
  const flow = spec.flow; let flowHits = []; let flowLength = 0;
  if (flow && flow.path) {
    const pts = sampleSmooth([flow.entry, ...flow.path, flow.exit].filter(Boolean)); flowLength = f(polyLength(pts) / Math.hypot(W, H));
    for (const s of subjects.filter((s) => (s.rank || 1) <= 2)) { const b = s.box; const hit = pts.some(([x, y]) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h); flowHits.push({ id: s.id || s.label, hit }); if (!hit) warn.push(`动线未经过主体 ${s.id || s.label}`); }
    if (flowLength < 0.8) warn.push(`动线过短 (${flowLength} 对角线)`);
  } else warn.push('没有动线');
  const first = subjects.find((s) => (s.rank || 1) === 1) || subjects[0]; let interweave = 0;
  if (first) {
    for (const e of els) {
      if (e.kind === 'lines') interweave += lineFamily(e, W, H).filter(([x1, y1, x2, y2]) => segRect(x1, y1, x2, y2, first.box)).length;
      if (e.kind === 'line') { const l = e.extend === false ? [e.x1, e.y1, e.x2, e.y2] : extendLine(e.x1, e.y1, e.x2, e.y2, W, H); if (segRect(...l, first.box)) interweave++; }
      if (e.kind === 'horizon') { const y = horizonY(e, H); if (y >= first.box.y && y <= first.box.y + first.box.h) interweave++; }
      if (e.kind === 'rings') interweave += (e.radii || []).filter((r) => circleRect(e.cx, e.cy, r, first.box)).length;
      if (e.kind === 'container' && e.r !== undefined && circleRect(e.cx, e.cy, e.r, first.box)) interweave++;
      if ((e.kind === 'bar' || e.kind === 'block') && segRect(e.x, e.y + e.h / 2, e.x + e.w, e.y + e.h / 2, first.box)) interweave++;
    }
    if (interweave < 2) warn.push(`装置穿过主体 ${first.id || first.label} 仅 ${interweave} 处`);
  }
  // Density: element centres over a 3×3 grid.
  const cells = new Array(9).fill(0); let n = 0;
  const centre = (e) => { if (e.box) return [e.box.x + e.box.w / 2, e.box.y + e.box.h / 2]; if (e.x !== undefined && e.w !== undefined) return [e.x + e.w / 2, e.y + e.h / 2]; if (e.x !== undefined) return [e.x, e.y]; if (e.cx !== undefined) return [e.cx, e.cy]; return null; };
  for (const e of els) { if (e.kind === 'trail' && e.path) { for (let i = 0; i < (e.count || 8); i++) { const [x, y] = alongPoly(e.path, (i + 0.5) / (e.count || 8)); cells[Math.min(2, Math.max(0, Math.floor(y / H * 3))) * 3 + Math.min(2, Math.max(0, Math.floor(x / W * 3)))]++; n++; } continue; } const c = centre(e); if (!c) continue; cells[Math.min(2, Math.max(0, Math.floor(c[1] / H * 3))) * 3 + Math.min(2, Math.max(0, Math.floor(c[0] / W * 3)))]++; n++; }
  const densest = n ? f(Math.max(...cells) / n) : 0, emptyCells = cells.filter((c) => c === 0).length;
  if (n >= 6 && densest < 0.3) warn.push(`疏密不足：最密格仅占 ${densest}`); if (n >= 6 && emptyCells === 0) warn.push('没有空格：九宫无一空');
  // Overflow per bar/frame/container; budgets.
  const closers = els.filter((e) => e.kind === 'bar' || e.kind === 'frame' || e.kind === 'container');
  const crossers = els.filter((e) => e.kind === 'subject' || e.kind === 'soft' || e.kind === 'type' || e.kind === 'block');
  let overflowOk = 0;
  for (const c of closers) { const cb = boxOf(c); const ok = crossers.some((e) => { const b = boxOf(e); const ix = Math.max(0, Math.min(b.x + b.w, cb.x + cb.w) - Math.max(b.x, cb.x)), iy = Math.max(0, Math.min(b.y + b.h, cb.y + cb.h) - Math.max(b.y, cb.y)); const inside = ix * iy / (b.w * b.h); return inside > 0 && inside < 0.8 && (c.kind !== 'bar' || iy > 0); }); if (ok) overflowOk++; }
  if (closers.length && overflowOk === 0) warn.push('没有元素决定性地越过任何分隔面、框或容器');
  const softCount = els.filter((e) => e.kind === 'soft').length; if (softCount !== 1) warn.push(`软元素 ${softCount} 个，应为 1`);
  for (const b of bands) { const v = els.filter((e) => e.kind === 'type' && (e.role || 'voice') === 'voice' && e.box.y >= b.y && e.box.y < b.y + b.h).length; if (v > 2) warn.push(`band ${b.id} 声部句 ${v} 条，超过 2`); }
  const marks = els.filter((e) => e.kind === 'mark').length; if (marks && (marks < 3 || marks > 7)) warn.push(`标点 ${marks} 个，默认 3–7`);
  const fragments = els.filter((e) => e.kind === 'trail').reduce((a, e) => a + (e.count || 8), 0);
  return { whitespace, scaleRatio, largest: f(largest), smallest, flowLength, flowHits, interweave, densest, emptyCells, overflowOk, closers: closers.length, softCount, marks, fragments, subjects: subjects.length, warnings: warn };
}

// ---------- main ----------
function writeOut(svg, fallback) { const out = args.out || fallback; fs.writeFileSync(out, svg); console.error(`wrote ${out}`); }
try {
  if (cmd === 'render') { const spec = loadSpec(positional[0]); writeOut(renderDocument(spec, { grid: !!args.grid, noFlow: !!args['no-flow'], scale: args.scale || 1 }), positional[0].replace(/\.json$/, '') + '.sketch.svg'); }
  else if (cmd === 'sheet') { const specs = positional.map(loadSpec); if (!specs.length) throw new Error('sheet needs at least one spec'); writeOut(renderSheet(specs, { scale: args.scale || 0.5, grid: !!args.grid }), 'sketch-sheet.svg'); }
  else if (cmd === 'overlay') { const spec = loadSpec(positional[0]); if (!positional[1]) throw new Error('overlay needs spec.json and shot.png'); writeOut(renderOverlay(spec, positional[1]), positional[1].replace(/\.png$/, '') + '.overlay.svg'); }
  else if (cmd === 'check') { const spec = loadSpec(positional[0]); const r = check(spec); if (args.json) console.log(JSON.stringify(r, null, 2)); else { for (const [k, v] of Object.entries(r)) if (k !== 'warnings') console.log(`${k}: ${Array.isArray(v) ? JSON.stringify(v) : v}`); console.log(r.warnings.length ? `warnings:\n  - ${r.warnings.join('\n  - ')}` : 'warnings: none'); } }
  else { console.error('usage: node sketch.mjs <render|sheet|overlay|check> spec.json [...] [-o out] [--grid] [--no-flow] [--scale n] [--json]'); process.exit(2); }
} catch (e) { console.error(`sketch: ${e.message}`); process.exit(1); }
