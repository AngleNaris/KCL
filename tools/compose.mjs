#!/usr/bin/env node
// KCL compose: generate System-layer and no-asset Subject geometry as SVG snippets.
// Usage: node compose.mjs <command> [--key value ...]
// Commands: lines dots stars radial rings orbit ridge flock contours
// Prints an SVG <g> (or a full <svg> with --full WxH) to stdout. No dependencies.

const [, , cmd, ...rest] = process.argv;

function parseArgs(list) {
  const out = {};
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = list[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    }
  }
  return out;
}
const args = parseArgs(rest);
const num = (k, d) => (args[k] === undefined ? d : Number(args[k]));
const str = (k, d) => (args[k] === undefined ? d : String(args[k]));
const box = (() => { const [w, h] = str('box', '1440x900').split('x').map(Number); return { w, h }; })();
const f = (n) => Number(n.toFixed(2));

// Seeded PRNG (mulberry32) and 1D/2D value noise.
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function noise1(seed) {
  const r = rng(seed); const table = Array.from({ length: 512 }, () => r());
  const lerp = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t));
  return (x) => { const i = Math.floor(x); const t = x - i; return lerp(table[i & 511], table[(i + 1) & 511], t); };
}
function fbm(n, x, oct) { let v = 0, amp = 1, fr = 1, norm = 0; for (let o = 0; o < oct; o++) { v += n(x * fr) * amp; norm += amp; amp *= 0.5; fr *= 2.1; } return v / norm; }

function wrap(body) {
  if (args.indexed) { let i = 0; body = body.replace(/\n  <(circle|path|line|ellipse)\b/g, (m, tag) => `\n  <${tag} style="--i:${i++}"`); }
  if (args.full) { const [w, h] = String(args.full).split('x').map(Number); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n${body}\n</svg>`; }
  return body;
}
const ink = str('stroke', 'var(--ink)');
const fill = str('fill', 'var(--ink)');
const hair = str('width', '1');

// --- lines: one diagonal family that exits the canvas, optional perpendiculars and horizon.
function lines() {
  const angle = num('angle', 27) * Math.PI / 180;
  const count = num('count', 3);
  const perp = num('perp', 1);
  const horizon = args.horizon === undefined ? null : Number(args.horizon);
  const margin = Math.max(box.w, box.h) * 0.2;
  const dir = { x: Math.cos(angle), y: -Math.sin(angle) }; // rising to the right in screen coords
  const nrm = { x: -dir.y, y: dir.x };
  const cx = box.w / 2, cy = box.h / 2;
  const span = Math.abs(box.w * nrm.x) + Math.abs(box.h * nrm.y); // perpendicular extent of the box
  const L = Math.hypot(box.w, box.h) + margin * 2;
  const out = [];
  const place = (d, n, k, total, dash) => {
    const offset = total === 1 ? 0 : (k / (total - 1) - 0.5) * span * 0.78;
    const px = cx + n.x * offset, py = cy + n.y * offset;
    const x1 = px - d.x * L / 2, y1 = py - d.y * L / 2, x2 = px + d.x * L / 2, y2 = py + d.y * L / 2;
    out.push(`  <line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"${dash ? ' stroke-dasharray="2 6"' : ''}/>`);
  };
  for (let k = 0; k < count; k++) place(dir, nrm, k, count, args.dash && k === count - 1);
  const pspan = Math.abs(box.w * dir.x) + Math.abs(box.h * dir.y);
  for (let k = 0; k < perp; k++) {
    const offset = perp === 1 ? -span * 0.12 : (k / (perp - 1) - 0.5) * pspan * 0.5;
    const px = cx + dir.x * offset, py = cy + dir.y * offset;
    out.push(`  <line x1="${f(px - nrm.x * L / 2)}" y1="${f(py - nrm.y * L / 2)}" x2="${f(px + nrm.x * L / 2)}" y2="${f(py + nrm.y * L / 2)}"/>`);
  }
  if (horizon !== null) out.push(`  <line x1="${-margin}" y1="${f(box.h * horizon)}" x2="${f(box.w + margin)}" y2="${f(box.h * horizon)}" stroke-dasharray="2 6"/>`);
  return `<g class="construction" stroke="${ink}" stroke-width="${hair}" vector-effect="non-scaling-stroke" fill="none">\n${out.join('\n')}\n</g>`;
}

// --- dots: rhythm points along a straight path or an arc, sizes stepping by ratio, spacing jittered.
function dots() {
  const count = num('count', 6), ratio = num('ratio', 1.5), start = num('start', 4), jitter = num('jitter', 0.25);
  const r = rng(num('seed', 7));
  const pts = [];
  const ts = []; let t = 0; const steps = [];
  for (let i = 0; i < count - 1; i++) steps.push(1 + (r() - 0.5) * 2 * jitter);
  const total = steps.reduce((a, b) => a + b, 0);
  ts.push(0); for (const s of steps) { t += s / total; ts.push(t); }
  if (args.arc) {
    const [cx, cy, rad, a0, a1] = str('arc').split(',').map(Number);
    for (const u of ts) { const a = (a0 + (a1 - a0) * u) * Math.PI / 180; pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); }
  } else {
    const [p0, p1] = str('path', '100,800 1300,120').split(' ').map((p) => p.split(',').map(Number));
    for (const u of ts) pts.push([p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u]);
  }
  const reverse = !!args.reverse;
  const out = pts.map(([x, y], i) => { const k = reverse ? count - 1 - i : i; const rr = start * Math.pow(ratio, k); return `  <circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}"/>`; });
  return `<g class="rhythm" fill="${fill}">\n${out.join('\n')}\n</g>`;
}

// --- stars: four-point punctuation marks.
// Astroid construction shared with kcl-render.mjs: concave sides, thin waist, taller than wide.
function starPath(cx, cy, size, sharp = 0.1, aspect = 1.3) {
  const R = size / 2, rx = R / Math.sqrt(aspect), ry = R * Math.sqrt(aspect);
  const pts = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < 4; i++) { const [x1, y1] = pts[(i + 1) % 4]; const mx = (pts[i][0] + x1) / 2, my = (pts[i][1] + y1) / 2; d += `Q${f(cx + (mx - cx) * sharp * 1.1)},${f(cy + (my - cy) * sharp * 1.1)} ${f(x1)},${f(y1)}`; }
  return `${d}Z`;
}
function stars() {
  const size = num('size', 14), sharp = num('sharp', 0.1);
  const at = str('at', '60,60 1380,60 60,840 1380,840').split(' ').map((p) => p.split(',').map(Number));
  const out = at.map(([x, y], i) => `  <path d="${starPath(x, y, size * (args.vary ? (i % 2 ? 0.7 : 1) : 1), sharp)}"/>`);
  return `<g class="marks" fill="${fill}">\n${out.join('\n')}\n</g>`;
}

// --- radial: burst of hairlines between two radii; every nth longer.
function radial() {
  const [cx, cy] = str('center', `${box.w / 2},${box.h / 2}`).split(',').map(Number);
  const inner = num('inner', 240), outer = num('outer', 330), count = num('count', 96), every = num('every', 4), extra = num('extra', 1.15);
  const out = [];
  for (let i = 0; i < count; i++) { const a = (i / count) * Math.PI * 2; const o = i % every === 0 ? outer * extra : outer; out.push(`  <line x1="${f(cx + inner * Math.cos(a))}" y1="${f(cy + inner * Math.sin(a))}" x2="${f(cx + o * Math.cos(a))}" y2="${f(cy + o * Math.sin(a))}"/>`); }
  return `<g class="radial" stroke="${ink}" stroke-width="${hair}" vector-effect="non-scaling-stroke">\n${out.join('\n')}\n</g>`;
}

// --- rings: concentric circles with optional per-ring dash.
function rings() {
  const [cx, cy] = str('center', `${box.w / 2},${box.h / 2}`).split(',').map(Number);
  const radii = str('radii', '270,300,330,420').split(',').map(Number);
  const dash = args.dash ? str('dash').split(',') : [];
  const out = radii.map((r, i) => `  <circle class="ring" cx="${cx}" cy="${cy}" r="${r}"${dash[i] && dash[i] !== '0' ? ` stroke-dasharray="${dash[i]}"` : ''}/>`);
  return `<g class="rings" stroke="${ink}" stroke-width="${hair}" vector-effect="non-scaling-stroke" fill="none">\n${out.join('\n')}\n</g>`;
}

// --- orbit: a tilted ellipse (a base ring under a standing subject).
function orbit() {
  const [cx, cy] = str('center', `${box.w / 2},${box.h * 0.84}`).split(',').map(Number);
  const rx = num('rx', 420), ry = num('ry', 60), tilt = num('tilt', -6);
  return `<g class="orbit" stroke="${ink}" stroke-width="${hair}" vector-effect="non-scaling-stroke" fill="none">\n  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${tilt} ${cx} ${cy})"/>\n</g>`;
}

// --- ridge: a mountain / coastline silhouette filled to the bottom of the box.
function ridge() {
  const n = noise1(num('seed', 3)); const base = num('base', 0.68), amp = num('amp', 0.28), oct = num('octaves', 4), freq = num('freq', 2.2), samples = num('samples', 160);
  const pts = [];
  for (let i = 0; i <= samples; i++) { const u = i / samples; const x = u * box.w; const v = fbm(n, u * freq, oct); const peak = Math.pow(v, 1.6); const y = box.h * (base - amp * peak * 1.6); pts.push(`${f(x)},${f(y)}`); }
  const d = `M${-20},${box.h + 20} L${pts.join(' L')} L${box.w + 20},${box.h + 20} Z`;
  return `<g class="ridge" fill="${fill}">\n  <path d="${d}"/>\n</g>`;
}

// --- flock: bird glyphs scattered along a quadratic curve, sizes stepping, light rotation.
function flock() {
  const r = rng(num('seed', 11)); const count = num('count', 14); const spread = num('spread', 60);
  const [p0, p1, p2] = str('curve', '200,700 720,200 1300,520').split(' ').map((p) => p.split(',').map(Number));
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count; const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]; const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
    const jx = (r() - 0.5) * spread * 2, jy = (r() - 0.5) * spread; const s = num('min', 6) + Math.pow(r(), 1.5) * (num('max', 26) - num('min', 6)); const rot = (r() - 0.5) * 40;
    const cx = x + jx, cy = y + jy;
    // Two wing arcs meeting at a body point: a swallow shorthand.
    const d = `M${f(cx - s)},${f(cy - s * 0.35)} Q${f(cx - s * 0.45)},${f(cy - s * 0.1)} ${f(cx)},${f(cy + s * 0.15)} Q${f(cx + s * 0.45)},${f(cy - s * 0.1)} ${f(cx + s)},${f(cy - s * 0.35)} Q${f(cx + s * 0.4)},${f(cy + s * 0.05)} ${f(cx)},${f(cy + s * 0.42)} Q${f(cx - s * 0.4)},${f(cy + s * 0.05)} ${f(cx - s)},${f(cy - s * 0.35)} Z`;
    out.push(`  <path d="${d}" transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"/>`);
  }
  return `<g class="flock" fill="${fill}">\n${out.join('\n')}\n</g>`;
}

// --- contours: noise-displaced concentric rings (topography).
function contours() {
  const [cx, cy] = str('center', `${box.w / 2},${box.h / 2}`).split(',').map(Number);
  const count = num('count', 9), r0 = num('inner', 40), r1 = num('outer', 420), amp = num('amp', 0.18), samples = num('samples', 180), seed = num('seed', 5);
  const out = [];
  for (let k = 0; k < count; k++) {
    const n = noise1(seed + k * 17); const base = r0 + (r1 - r0) * (k / (count - 1)); const pts = [];
    // Periodic displacement: blend the noise at u and u-1 so the ring closes without a seam.
    const T = 3 + k * 0.15;
    const per = (u) => (1 - u) * fbm(n, u * T + 10, 3) + u * fbm(n, (u - 1) * T + 10, 3);
    for (let i = 0; i < samples; i++) { const a = (i / samples) * Math.PI * 2; const u = i / samples; const d = (per(u) - 0.5) * 2; const rad = base * (1 + amp * d); pts.push(`${f(cx + rad * Math.cos(a))},${f(cy + rad * Math.sin(a))}`); }
    out.push(`  <path d="M${pts.join(' L')} Z"/>`);
  }
  return `<g class="contours" stroke="${ink}" stroke-width="${hair}" vector-effect="non-scaling-stroke" fill="none">\n${out.join('\n')}\n</g>`;
}

const commands = { lines, dots, stars, radial, rings, orbit, ridge, flock, contours };
if (!cmd || !commands[cmd]) {
  console.error(`usage: node compose.mjs <${Object.keys(commands).join('|')}> [--box 1440x900] [--full WxH] [--indexed] [--stroke c] [--fill c] [--width n] ...`);
  process.exit(2);
}
process.stdout.write(wrap(commands[cmd]()) + '\n');
