// KCL render library: spec-v2 → final SVG. Pure ES module, no dependencies, runs in Node and in the browser.
// The same function draws the plate for the Studio, for the CLI export and for Playwright screenshots, so
// what the user sees, what the model screenshots and what ships are one render.
//
// Exports: migrateSpec, normalizeSpec, renderPlate, wireOverlay, checkStructure, LADDER, resolveAnchor,
//          subjectTransform, flowSample, elementBox, layerOf, LAYER_ORDER, starPath.

export const SPEC_V1 = 'spec-v1';
export const SPEC_V2 = 'spec-v2';

// Missing mode preserves the historical diagnostic profile; new work explicitly selects its mode.
export function compositionMode(spec) {
  const mode = spec.artDirection?.mode ?? 'reduced';
  if (!['hybrid', 'reduced'].includes(mode)) throw new Error(`unknown artDirection.mode: ${mode}`);
  return mode;
}

// ---------- the ladders (SKL-14, GOV-3 defaults) ----------
// Weight classes in canvas px at a 900px short side; scaled by min(W,H)/900. Nothing between the rungs.
export const LADDER = {
  weight: { hairline: 0.75, line: 2, rule: 5, band: 14, bar: null }, // bar: solid plane, height from the element
  ghost: 0.12,                       // the only partial opacity for ink (COL-1 --ghost)
  softOpacity: 0.85,                 // the single soft element must count (TEX-2)
  barMin: 0.015,                     // bars at least 1.5% of the short side
  scale: {                           // fractions of the short side S; defaults, not laws
    subject: [0.55, 1.4], container: [0.55, 0.75], planeType: [0.2, 0.35],
    rhythmMax: [0.02, 0.05], mark: [0.01, 0.04], fragment: [0.005, 0.04], signalCarrier: 0.03,
  },
};

export const LAYER_ORDER = ['ground', 'plane', 'typePlane', 'subject', 'system', 'fragment', 'signal', 'type', 'overlay', 'quiet'];
const KIND_LAYER = { material: 'plane', system: 'system', field: 'plane', sweep: 'plane', ticks: 'system', arc: 'system', glyphs: 'fragment', blob: 'signal', ribbon: 'signal', tag: 'type', grid: 'system', bar: 'plane', block: 'plane', frame: 'plane', container: 'plane', subject: 'subject', lines: 'system', line: 'system', horizon: 'system', rings: 'system', radial: 'system', orbit: 'system', rhythm: 'system', trail: 'fragment', mark: 'signal', soft: 'signal', rule: 'signal', type: 'type', quiet: 'quiet' };
export function layerOf(el) { if (el.layer) return el.layer; if (el.kind === 'type' && (el.role || 'voice') === 'plane') return 'typePlane'; return KIND_LAYER[el.kind] || 'system'; }

// Default weight / fill / ink per kind. `fg` is the foreground role (ink on a paper ground, paper on an ink ground).
const KIND_DEFAULTS = {
  bar: { weight: 'bar', fill: 'solid', ink: 'fg' }, block: { weight: 'bar', fill: 'ghost', ink: 'fg' }, frame: { weight: 'line', fill: 'outline', ink: 'fg' },
  container: { weight: 'line', fill: 'outline', ink: 'fg' }, lines: { weight: 'hairline', fill: 'outline', ink: 'fg' }, line: { weight: 'hairline', fill: 'outline', ink: 'fg' },
  horizon: { weight: 'hairline', fill: 'outline', ink: 'fg' }, rings: { weight: 'hairline', fill: 'outline', ink: 'fg' }, radial: { weight: 'hairline', fill: 'outline', ink: 'fg' },
  orbit: { weight: 'line', fill: 'outline', ink: 'fg' }, rhythm: { weight: 'line', fill: 'solid', ink: 'fg' }, trail: { weight: 'line', fill: 'solid', ink: 'fg' },
  mark: { weight: 'line', fill: 'solid', ink: 'signal' }, soft: { weight: 'band', fill: 'solid', ink: 'signal' }, rule: { weight: 'rule', fill: 'solid', ink: 'signal' },
  type: { weight: 'line', fill: 'solid', ink: 'fg' }, subject: { weight: 'line', fill: 'solid', ink: 'fg' }, quiet: {},
  field: { weight: 'line', fill: 'solid', ink: 'fg' }, sweep: { weight: 'band', fill: 'solid', ink: 'fg' }, ticks: { weight: 'hairline', fill: 'outline', ink: 'fg' }, arc: { weight: 'line', fill: 'outline', ink: 'fg' },
  glyphs: { weight: 'line', fill: 'solid', ink: 'fg' }, system: { weight: 'line', fill: 'solid', ink: 'fg' }, blob: { weight: 'band', fill: 'solid', ink: 'signal' }, ribbon: { weight: 'band', fill: 'solid', ink: 'signal' }, tag: { weight: 'bar', fill: 'solid', ink: 'fg' }, grid: { weight: 'hairline', fill: 'outline', ink: 'fg' },
};

const f = (n) => Number(Number(n).toFixed(2));
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- geometry ----------
export function polyLength(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
export function alongPoly(pts, u) {
  const total = polyLength(pts); let d = u * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= seg || i === pts.length - 1) { const t = seg === 0 ? 0 : Math.min(1, d / seg); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
    d -= seg;
  }
  return [...pts[0], 0];
}
export function smoothPath(pts) {
  if (!pts || pts.length < 2) return '';
  if (pts.length === 2) return `M${f(pts[0][0])},${f(pts[0][1])} L${f(pts[1][0])},${f(pts[1][1])}`;
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}
export function sampleSmooth(pts, n = 32) {
  if (!pts || pts.length < 3) return pts || [];
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 0; k < n; k++) { const t = k / n, mt = 1 - t; out.push([mt ** 3 * p1[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * p2[0], mt ** 3 * p1[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * p2[1]]); }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
export function flowPoints(flow) { return flow ? [flow.entry, ...(flow.path || []), flow.exit].filter(Boolean) : []; }
// A sub-path of the flow between fractions a and b of its length (for `along`).
export function flowSample(flow, a = 0, b = 1, n = 6) {
  const pts = sampleSmooth(flowPoints(flow), 24); if (pts.length < 2) return [];
  const out = []; for (let i = 0; i <= n; i++) { const [x, y] = alongPoly(pts, a + (b - a) * i / n); out.push([f(x), f(y)]); } return out;
}
export function lineFamily(el, W, H) {
  const angle = (el.angle ?? 27) * Math.PI / 180, count = el.count ?? 3, perp = el.perp ?? 0;
  const dir = { x: Math.cos(angle), y: -Math.sin(angle) }, nrm = { x: -dir.y, y: dir.x };
  const L = Math.hypot(W, H) * 1.6, cx = el.through ? el.through[0] : W / 2, cy = el.through ? el.through[1] : H / 2;
  const span = Math.abs(W * nrm.x) + Math.abs(H * nrm.y), pspan = Math.abs(W * dir.x) + Math.abs(H * dir.y);
  const out = [];
  for (let k = 0; k < count; k++) { const o = count === 1 ? 0 : (k / (count - 1) - 0.5) * span * (el.spread ?? 0.78); const px = cx + nrm.x * o, py = cy + nrm.y * o; out.push([px - dir.x * L / 2, py - dir.y * L / 2, px + dir.x * L / 2, py + dir.y * L / 2]); }
  for (let k = 0; k < perp; k++) { const o = perp === 1 ? -span * 0.12 : (k / (perp - 1) - 0.5) * pspan * 0.5; const px = cx + dir.x * o, py = cy + dir.y * o; out.push([px - nrm.x * L / 2, py - nrm.y * L / 2, px + nrm.x * L / 2, py + nrm.y * L / 2]); }
  return out;
}
export function extendLine(x1, y1, x2, y2, W, H) { const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(W, H) * 1.6 / (Math.hypot(dx, dy) || 1); return [x1 - dx * L, y1 - dy * L, x2 + dx * L, y2 + dy * L]; }
// Four-pointed star as the references draw it: concave curved sides (astroid), a thin waist and needle points,
// usually taller than wide. `sharp` is the waist (0.06 needle … 0.3 blunt); `aspect` stretches the vertical axis.
// The pre-2026-11-16 straight-edged polygon is kept as `straight` for the one case that wants a blunt glyph.
export const starPath = (cx, cy, size, sharp = 0.1, aspect = 1.3, straight = false) => {
  const R = size / 2, w = sharp ?? 0.1, asp = aspect ?? 1.3;
  if (straight) { const r = R * w, p = []; for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, rad = i % 2 === 0 ? R : r; p.push(`${f(cx + rad * Math.cos(a) / Math.sqrt(asp))},${f(cy + rad * Math.sin(a) * Math.sqrt(asp))}`); } return `M${p.join('L')}Z`; }
  const rx = R / Math.sqrt(asp), ry = R * Math.sqrt(asp);
  const pts = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < 4; i++) { const [x1, y1] = pts[(i + 1) % 4]; const mx = (pts[i][0] + x1) / 2, my = (pts[i][1] + y1) / 2; d += `Q${f(cx + (mx - cx) * w * 1.1)},${f(cy + (my - cy) * w * 1.1)} ${f(x1)},${f(y1)}`; }
  return `${d}Z`;
};
// A star mark as a cluster: the outline/fill body, an optional nested inner star, optional satellites.
export function starMark(x, y, s, el, col, innerCol, lineW) {
  const d = starPath(x, y, s, el.sharp, el.aspect, el.straight);
  const rot = el.rotate ? ` transform="rotate(${f(el.rotate)} ${f(x)} ${f(y)})"` : '';
  const body = el.outline ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(lineW)}"${rot}/>` : `<path d="${d}" fill="${col}"${rot}/>`;
  const inner = el.inner ? `<path d="${starPath(x, y, s * el.inner, Math.max(el.sharp ?? 0.1, 0.12), el.aspect, el.straight)}" fill="${innerCol || col}"${rot}/>` : '';
  const sats = (el.satellites || []).map((q) => `<path d="${starPath(x + q[0] * s, y + q[1] * s, s * (q[2] || 0.3), Math.max(el.sharp ?? 0.1, 0.12), el.aspect, el.straight)}" fill="${col}"${rot}/>`).join('');
  return body + inner + sats;
}
export const horizonY = (el, H) => (el.y <= 1 ? el.y * H : el.y);
export function elementBox(el, W = 0, H = 0) {
  if (el.box) return el.box;
  if (el.kind === 'horizon') return { x: 0, y: horizonY(el, H) - 1, w: W, h: 2 };
  if (el.r !== undefined) return { x: el.cx - el.r, y: el.cy - el.r, w: el.r * 2, h: el.r * 2 };
  if (el.kind === 'rings') { const r = Math.max(...(el.radii || [0])); return { x: el.cx - r, y: el.cy - r, w: r * 2, h: r * 2 }; }
  if (el.kind === 'radial') { const r = el.outer; return { x: el.cx - r, y: el.cy - r, w: r * 2, h: r * 2 }; }
  if (el.kind === 'orbit') return { x: el.cx - el.rx, y: el.cy - el.ry, w: el.rx * 2, h: el.ry * 2 };
  if (el.kind === 'system' && el.rx !== undefined) { const r = Math.max(el.rx, el.ry || el.rx); return { x: el.cx - r, y: el.cy - r, w: r * 2, h: r * 2 }; }
  if (el.kind === 'arc' || el.kind === 'ticks') { const r = (el.r || 0) + (el.len || 0); if (el.r !== undefined) return { x: el.cx - r, y: el.cy - r, w: r * 2, h: r * 2 }; }
  if (el.kind === 'blob') { const r = el.r || 40; return { x: el.cx - r, y: el.cy - r, w: r * 2, h: r * 2 }; }
  if (el.kind === 'mark') { const s = el.size || 16; return { x: el.x - s / 2, y: el.y - s / 2, w: s, h: s }; }
  if (el.kind === 'lines') return { x: 0, y: 0, w: W, h: H }; // a line family runs across the whole canvas
  if (el.kind === 'rule' || el.kind === 'line') return { x: Math.min(el.x1, el.x2), y: Math.min(el.y1, el.y2), w: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1) };
  if (el.path) { const xs = el.path.map((p) => p[0]), ys = el.path.map((p) => p[1]); return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; }
  if (el.x !== undefined && el.w !== undefined) return { x: el.x, y: el.y, w: el.w, h: el.h };
  return { x: 0, y: 0, w: 0, h: 0 };
}


// One glyph of the fragment alphabet. `ph` is the moon phase 0..1 (0 new, 0.5 full) for `phase`.
function glyphSvg(sh, x, y, s, rot, col, lineW, ph = 0.5, el = null, opts = null, resolve = null, tintFilter = null) {
  const g = `transform="rotate(${f(rot)} ${f(x)} ${f(y)})"`;
  if (sh === 'phase') { const R = s / 2; const t = Math.cos(ph * Math.PI * 2); const inner = -t * R; // -R new … +R full … -R new
    if (ph >= 0.5 - 0.02 && ph <= 0.5 + 0.02) return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="${col}"/>`;
    const right = ph < 0.5; const sw1 = right ? 1 : 0; const d = `M${f(x)},${f(y - R)} A${f(R)},${f(R)} 0 0 ${sw1} ${f(x)},${f(y + R)} A${f(Math.max(0.01, Math.abs(inner)))},${f(R)} 0 0 ${(inner > 0) === right ? 0 : 1} ${f(x)},${f(y - R)} Z`;
    return `<path ${g} d="${d}" fill="${col}"/>`; }
  if (sh === 'star') return `<path ${g} d="${starPath(x, y, s, el?.sharp, el?.aspect, el?.straight)}" fill="${col}"/>`;
  if (sh === 'dot') return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="${col}"/>`;
  if (sh === 'ring') return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="none" stroke="${col}" stroke-width="${f(lineW)}"/>`;
  if (sh === 'cross') return `<path ${g} d="M${f(x - s / 2)},${f(y)} H${f(x + s / 2)} M${f(x)},${f(y - s / 2)} V${f(y + s / 2)}" stroke="${col}" stroke-width="${f(lineW)}"/>`;
  if (sh === 'drop') return `<path ${g} d="M${f(x)},${f(y - s / 2)} C${f(x + s / 2)},${f(y + s * 0.1)} ${f(x + s / 3)},${f(y + s / 2)} ${f(x)},${f(y + s / 2)} C${f(x - s / 3)},${f(y + s / 2)} ${f(x - s / 2)},${f(y + s * 0.1)} ${f(x)},${f(y - s / 2)} Z" fill="${col}"/>`;
  if (sh === 'shard') return `<rect ${g} x="${f(x - s / 2)}" y="${f(y - s / 6)}" width="${f(s)}" height="${f(s / 3)}" fill="${col}"/>`;
  if (sh === 'tick') return `<rect ${g} x="${f(x - s * 0.06)}" y="${f(y - s / 2)}" width="${f(Math.max(0.75, s * 0.12))}" height="${f(s)}" fill="${col}"/>`;
  if (sh === 'square') return `<rect ${g} x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${f(s)}" height="${f(s)}" fill="none" stroke="${col}" stroke-width="${f(lineW)}"/>`;
  if (sh === 'tri') return `<path ${g} d="M${f(x)},${f(y - s / 2)} L${f(x + s / 2)},${f(y + s / 2)} L${f(x - s / 2)},${f(y + s / 2)} Z" fill="${col}"/>`;
  if (sh === 'image' && el && el.src) { const asset = opts?.assets?.[el.src]; const aw = asset?.w || 100, ah = asset?.h || 100; const sc = s / Math.max(aw, ah); return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${f(sc)}) translate(${f(-aw / 2)},${f(-ah / 2)})"><image href="${esc(resolve(el.src))}" width="${aw}" height="${ah}"${el.tint === false ? '' : ` filter="url(#${tintFilter(col)})`}/></g>`; }
  return '';
}
// Points of an ordered system: along an explicit path, the flow (`along`), or an ellipse arc (cx cy rx ry tilt start end, degrees).
function systemPoints(el, n) {
  const out = [];
  if (el.rx !== undefined) { const ry = el.ry ?? el.rx; const a0 = (el.start ?? 0) * Math.PI / 180, a1 = (el.end ?? 360) * Math.PI / 180; const closed = Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6; const t = (el.tilt || 0) * Math.PI / 180;
    const at = (a) => { const px = el.rx * Math.cos(a), py = ry * Math.sin(a); const x = el.cx + px * Math.cos(t) - py * Math.sin(t), y = el.cy + px * Math.sin(t) + py * Math.cos(t); const tx = -el.rx * Math.sin(a), ty = ry * Math.cos(a); return [x, y, Math.atan2(tx * Math.sin(t) + ty * Math.cos(t), tx * Math.cos(t) - ty * Math.sin(t))]; };
    // `spacing: 'arc'` steps evenly along the curve, the way a hand spaces dots; the default steps evenly in the ellipse parameter, which crowds the ends of the long axis.
    let cum = null; const M = 720; if (el.spacing === 'arc') { cum = [0]; let p = at(a0); for (let i = 1; i <= M; i++) { const q = at(a0 + (a1 - a0) * i / M); cum.push(cum[i - 1] + Math.hypot(q[0] - p[0], q[1] - p[1])); p = q; } }
    for (let j = 0; j < n; j++) { const u = closed ? j / n : n === 1 ? 0 : j / (n - 1); let a = a0 + (a1 - a0) * u; if (cum) { const d = u * cum[M]; let i = 1; while (i < M && cum[i] < d) i++; a = a0 + (a1 - a0) * (i - 1 + (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1)) / M; } out.push([...at(a), u]); }
    return out; }
  const pts = el.path || []; if (pts.length < 2) return out; const u0 = el.from ?? 0, u1 = el.to ?? 1;
  for (let j = 0; j < n; j++) { const u = n === 1 ? 0 : j / (n - 1); const [x, y, a] = alongPoly(pts, u0 + (u1 - u0) * u); out.push([x, y, a, u]); }
  return out;
}

// ---------- anomaly (特异, SKL-17) ----------
// A repeating element may name one member that breaks its rule in one attribute: `anomaly: { at, ink | size | shape | weight | rotate | fill }`.
// The stops of a rhythm along its path (irregular steps, seeded) and the member angles of ring ticks, radial lines and arc dots.
function rhythmStops(el) { const n = el.count || 6, r = rng(el.seed || 7); const steps = []; for (let j = 0; j < n - 1; j++) steps.push(1 + (r() - 0.5) * 0.5); const tot = steps.reduce((a, b) => a + b, 0); const ts = [0]; let t = 0; for (const s of steps) { t += s / tot; ts.push(t); } return ts; }
const ringAngle = (el, j, n) => { const a0 = (el.start ?? 0) * Math.PI / 180, a1 = (el.end ?? 360) * Math.PI / 180; return a0 + (a1 - a0) * (a1 - a0 >= Math.PI * 2 - 1e-6 ? j / n : n === 1 ? 0 : j / (n - 1)); };
const radialAngle = (el, j, n) => j / n * Math.PI * 2 + (el.rotate || 0) * Math.PI / 180;
const arcAngle = (el, j, n) => { const a0 = (el.start ?? 0) * Math.PI / 180, a1 = (el.end ?? 180) * Math.PI / 180; return a0 + (a1 - a0) * j / n; };
// The members of a repeating element in drawing order: a point for glyphs, ticks and dots, a segment for a line family, a radius for rings.
export function members(el, W = 0, H = 0) {
  const kind = el.kind;
  if (kind === 'system') return systemPoints(el, el.count || 9).map(([x, y]) => ({ p: [x, y] }));
  if (kind === 'rhythm') return Array.isArray(el.path) && el.path.length > 1 ? rhythmStops(el).map((u) => ({ p: alongPoly(el.path, u).slice(0, 2) })) : [];
  if (kind === 'ticks') { const n = el.count || 60; return Array.from({ length: n }, (_, j) => { if (el.r !== undefined) { const a = ringAngle(el, j, n); return { p: [el.cx + el.r * Math.cos(a), el.cy + el.r * Math.sin(a)] }; } const t = n === 1 ? 0 : j / (n - 1); return { p: [el.x1 + (el.x2 - el.x1) * t, el.y1 + (el.y2 - el.y1) * t] }; }); }
  if (kind === 'radial') { const n = el.count || 48; return Array.from({ length: n }, (_, j) => { const a = radialAngle(el, j, n); return { p: [el.cx + el.outer * Math.cos(a), el.cy + el.outer * Math.sin(a)] }; }); }
  if (kind === 'arc') return el.dots ? Array.from({ length: el.dots + 1 }, (_, j) => { const a = arcAngle(el, j, el.dots); return { p: [el.cx + el.r * Math.cos(a), el.cy + el.r * Math.sin(a)] }; }) : [];
  if (kind === 'rings') return (el.radii || []).map((r) => ({ r }));
  if (kind === 'lines') return lineFamily(el, W, H).map((seg) => ({ seg }));
  return [];
}
// Which member is the odd one. `at` is an index (negative counts from the end), first | mid | last, a ray of the axis cross seen from
// the element's centre (axis | perp | -axis | -perp), or { near: point } for the member nearest a point. Unresolved gives index -1.
function resolveAnomaly(el, a, W, H, axis, pointOf) {
  const ms = members(el, W, H), n = ms.length, at = a.at ?? 'mid'; let index = -1;
  if (Number.isInteger(at)) index = at < 0 ? n + at : at;
  else if (at === 'first') index = 0; else if (at === 'last') index = n - 1; else if (at === 'mid') index = Math.floor((n - 1) / 2);
  else if (typeof at === 'string' && /^-?(axis|perp)$/.test(at)) {
    const pts = ms.filter((m) => m.p).map((m) => m.p); const c = el.cx !== undefined ? [el.cx, el.cy] : pts.length ? [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length] : [W / 2, H / 2];
    const deg = (axis + (at.endsWith('perp') ? 90 : 0) + (at[0] === '-' ? 180 : 0)) * Math.PI / 180, d = [Math.cos(deg), -Math.sin(deg)]; let best = -Infinity;
    ms.forEach((m, j) => { if (!m.p) return; const v = [m.p[0] - c[0], m.p[1] - c[1]], s = (v[0] * d[0] + v[1] * d[1]) / (Math.hypot(v[0], v[1]) || 1); if (s > best) { best = s; index = j; } });
  } else if (at && typeof at === 'object' && at.near !== undefined) {
    const q = pointOf(at.near); let best = Infinity;
    if (q) ms.forEach((m, j) => { const dist = m.p ? Math.hypot(m.p[0] - q[0], m.p[1] - q[1]) : m.seg ? Math.abs((m.seg[2] - m.seg[0]) * (m.seg[1] - q[1]) - (m.seg[0] - q[0]) * (m.seg[3] - m.seg[1])) / (Math.hypot(m.seg[2] - m.seg[0], m.seg[3] - m.seg[1]) || 1) : Math.abs(Math.hypot(q[0] - el.cx, q[1] - el.cy) - m.r); if (dist < best) { best = dist; index = j; } });
  }
  if (!(index >= 0 && index < n)) index = -1;
  return { ...a, index, of: n, point: ms[index]?.p || null };
}

// ---------- subjects: fit transform and anatomy ----------
// Maps asset pixel space to canvas space for a subject box with fit cover|contain|stretch and align fx,fy.
export function subjectTransform(el, asset) {
  const b = el.box, aw = asset?.w || b.w, ah = asset?.h || b.h, fit = el.fit || 'contain';
  const [fx, fy] = el.align || [0.5, 0.5];
  let s;
  if (fit === 'stretch') return { sx: b.w / aw, sy: b.h / ah, tx: b.x, ty: b.y, aw, ah };
  s = fit === 'cover' ? Math.max(b.w / aw, b.h / ah) : Math.min(b.w / aw, b.h / ah);
  return { sx: s, sy: s, tx: b.x + (b.w - aw * s) * fx, ty: b.y + (b.h - ah * s) * fy, aw, ah };
}
// Resolve a named point of a subject in canvas coordinates. Landmarks are normalized asset coordinates (0–1).
export function resolveAnchor(subject, at, asset) {
  const b = subject.box, an = subject.anatomy || {};
  const T = subjectTransform(subject, asset);
  const fromAsset = ([u, v]) => [T.tx + u * T.aw * T.sx, T.ty + v * T.ah * T.sy];
  if (Array.isArray(at)) return [b.x + at[0] * b.w, b.y + at[1] * b.h];
  if (typeof at === 'string' && at.startsWith('box:')) { const [u, v] = at.slice(4).split(',').map(Number); return [b.x + u * b.w, b.y + v * b.h]; }
  if (at === 'centre' || at === 'center') return [b.x + b.w / 2, b.y + b.h / 2];
  if (at === 'centroid' && an.centroid) return fromAsset(an.centroid);
  if (at === 'top' && an.top) return fromAsset(an.top);
  if (an.landmarks && an.landmarks[at]) return fromAsset(an.landmarks[at]);
  if (at === 'centroid' || at === 'top') return at === 'top' ? [b.x + b.w / 2, b.y] : [b.x + b.w / 2, b.y + b.h / 2];
  return [b.x + b.w / 2, b.y + b.h / 2];
}

// ---------- migration and normalization ----------
export function migrateSpec(input) {
  const spec = structuredClone(input);
  if (spec.kcl === SPEC_V2) return spec;
  if (spec.kcl !== SPEC_V1) throw new Error(`expected "kcl": "${SPEC_V1}" or "${SPEC_V2}", got ${spec.kcl}`);
  spec.kcl = SPEC_V2;
  spec.color = spec.color || {}; spec.color.ground = spec.color.ground || 'paper';
  spec.finish = spec.finish || { overlay: 'none' };
  spec.elements = (spec.elements || []).map((el) => {
    const d = KIND_DEFAULTS[el.kind] || {}; const out = { ...el };
    if (el.kind === 'subject') { out.fit = out.fit || 'contain'; out.render = out.render || 'reduced'; out.levels = (out.levels || []).map((l) => (typeof l === 'string' ? { mode: l } : l)); }
    else if (el.kind !== 'quiet') { out.weight = out.weight || d.weight; out.fill = out.fill || d.fill; out.ink = out.ink || d.ink; }
    return out;
  });
  spec.migratedFrom = SPEC_V1;
  return spec;
}
// Fill defaults and resolve anchors / along / through into concrete coordinates. Returns a new spec.
export function normalizeSpec(input, opts = {}) {
  const spec = migrateSpec(input);
  compositionMode(spec);
  const { w: W, h: H } = spec.canvas; const assets = opts.assets || {};
  const subjects = Object.fromEntries(spec.elements.filter((e) => e.kind === 'subject').map((e) => [e.id, e]));
  const assetOf = (sub) => { const main = (sub.levels || []).find((l) => l.src) || {}; return assets[main.src] || sub.assetSize || null; };
  const anchorPoint = (anchor) => {
    const sub = subjects[anchor.to]; if (!sub) return null;
    const p = resolveAnchor(sub, anchor.at || 'centroid', assetOf(sub));
    return [p[0] + (anchor.offset?.[0] || 0), p[1] + (anchor.offset?.[1] || 0)];
  };
  // A point given as [x, y], as an anchor object, or as 'subject.landmark'.
  const pointOf = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? anchorPoint({ to: v.split('.')[0], at: v.split('.').slice(1).join('.') || undefined }) : v && v.to ? anchorPoint(v) : null);
  spec.elements = spec.elements.map((raw) => {
    const el = { ...raw }; const d = KIND_DEFAULTS[el.kind] || {};
    if (el.layer && !LAYER_ORDER.includes(el.layer)) throw new Error(`invalid layer: ${el.layer}`);
    if (el.kind === 'material') {
      if (el.layer === 'quiet') throw new Error('quiet is a guide layer, not a material output layer');
      const b = el.box;
      if (!b || ![b.x, b.y, b.w, b.h].every(Number.isFinite) || b.w <= 0 || b.h <= 0) throw new Error(`material ${el.id || ''} requires a finite, positive box`);
      if (el.fit && !['contain', 'cover', 'stretch'].includes(el.fit)) throw new Error(`invalid material fit: ${el.fit}`);
      if (el.align && (!Array.isArray(el.align) || el.align.length !== 2 || !el.align.every(v => [0, 0.5, 1].includes(v)))) throw new Error('material align uses 0, 0.5 or 1 on each axis');
      if (el.opacity !== undefined && (!Number.isFinite(el.opacity) || el.opacity < 0 || el.opacity > 1)) throw new Error('material opacity must be between 0 and 1');
      if (el.rotate !== undefined && !Number.isFinite(el.rotate)) throw new Error('material rotate must be finite');
      if (el.blend && !['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference', 'exclusion', 'color-burn', 'color-dodge', 'hard-light', 'soft-light', 'hue', 'saturation', 'color', 'luminosity'].includes(el.blend)) throw new Error(`invalid material blend: ${el.blend}`);
    }
    if (el.kind !== 'subject' && el.kind !== 'quiet') { el.weight = el.weight || d.weight; el.fill = el.fill || d.fill; el.ink = el.ink || d.ink; }
    // SKL-18 kinship: angles and tilts may name the plate's axis; a line may be born radial or tangent to a centre.
    const AXIS = spec.axis ?? spec.principles?.alignment?.angle ?? 27;
    const angOf = (v) => (v === 'axis' ? AXIS : v === 'perp' ? AXIS + 90 : v);
    if (el.kind === 'lines' && typeof el.angle === 'string') el.angle = angOf(el.angle);
    if ((el.kind === 'orbit' || el.kind === 'system' || el.kind === 'field') && typeof el.tilt === 'string') el.tilt = -angOf(el.tilt);
    if ((el.kind === 'line' || el.kind === 'rule') && (el.radial || el.tangent)) {
      const c = el.anchor ? anchorPoint(el.anchor) : [el.cx ?? W / 2, el.cy ?? H / 2];
      if (c) {
        const rel = el.radial || el.tangent; const a = angOf(rel.at ?? 'axis') * Math.PI / 180; const dir = [Math.cos(a), -Math.sin(a)];
        if (el.radial) { const r0 = rel.from ?? 0, r1 = rel.to ?? Math.hypot(W, H); el.x1 = c[0] + dir[0] * r0; el.y1 = c[1] + dir[1] * r0; el.x2 = c[0] + dir[0] * r1; el.y2 = c[1] + dir[1] * r1; }
        else { const r = rel.r ?? 0; const q = [c[0] + dir[0] * r, c[1] + dir[1] * r]; const t = [-dir[1], dir[0]]; const L = rel.len ?? Math.hypot(W, H) * 1.6; el.x1 = q[0] - t[0] * L / 2; el.y1 = q[1] - t[1] * L / 2; el.x2 = q[0] + t[0] * L / 2; el.y2 = q[1] + t[1] * L / 2; }
        el.cx = c[0]; el.cy = c[1]; delete el.anchor;
      }
    }
    if (el.anchor) {
      const p = anchorPoint(el.anchor);
      if (p) {
        if (el.kind === 'lines') el.through = p;
        else if (el.cx !== undefined || el.rx !== undefined || el.r !== undefined || ['container', 'rings', 'radial', 'orbit', 'ticks', 'arc', 'blob', 'system', 'field'].includes(el.kind)) { el.cx = p[0]; el.cy = p[1]; }
        else if (el.kind === 'mark') { el.x = p[0]; el.y = p[1]; }
        else if (el.kind === 'soft' || el.kind === 'bar' || el.kind === 'block' || el.kind === 'frame') { el.x = p[0] - (el.w || 0) / 2; el.y = p[1] - (el.h || 0) / 2; }
        else if (el.box) { el.box = { ...el.box, x: p[0] - el.box.w / 2, y: p[1] - el.box.h / 2 }; }
        else if (el.kind === 'line' || el.kind === 'rule') { const dx = (el.x2 - el.x1) / 2, dy = (el.y2 - el.y1) / 2; el.x1 = p[0] - dx; el.y1 = p[1] - dy; el.x2 = p[0] + dx; el.y2 = p[1] + dy; }
        else if (el.kind === 'horizon') el.y = p[1];
      }
    }
    if (el.along && spec.flow) { const a = el.along; el.path = flowSample(spec.flow, a.from ?? 0, a.to ?? 1, a.samples || 6); }
    if (el.kind === 'horizon') el.y = horizonY(el, H);
    if (el.anomaly) el.anomaly = [].concat(el.anomaly).filter((a) => a && typeof a === 'object').map((a) => resolveAnomaly(el, a, W, H, AXIS, pointOf));
    return el;
  });
  spec.__W = W; spec.__H = H;
  return spec;
}

// ---------- colors ----------
function palette(spec) {
  const c = spec.color || {}; const paper = c.paper || '#f3efe6', ink = c.ink || '#111111', signal = c.signal || '#ff3b1f', signal2 = c.signal2 || signal;
  const inverted = c.ground === 'ink';
  return { paper, ink, signal, signal2, bg: inverted ? ink : paper, fg: inverted ? paper : ink, inverted };
}
function colorOf(role, pal) { return ({ fg: pal.fg, bg: pal.bg, ink: pal.ink, paper: pal.paper, signal: pal.signal, signal2: pal.signal2 })[role] || role || pal.fg; }

// ---------- rendering ----------
const FONT_FALLBACK = { display: "'Noto Serif SC','Noto Serif CJK SC','Source Han Serif SC','Songti SC',SimSun,Georgia,serif", text: "'Noto Serif SC','Noto Serif CJK SC','Songti SC',SimSun,Georgia,serif", mono: "'DejaVu Sans Mono','Noto Sans Mono CJK SC',Menlo,Consolas,monospace" };

export function renderPlate(input, opts = {}) {
  const spec = input.__W ? input : normalizeSpec(input, opts);
  const { w: W, h: H } = spec.canvas; const S = Math.min(W, H); const k = S / 900;
  const pal = palette(spec); const id = opts.id || 'p'; const resolve = opts.resolve || ((src) => src);
  const visible = opts.layers ? new Set(opts.layers) : null;
  const withIds = opts.ids !== false;
  const wpx = (w) => (w === 'bar' ? Math.max(LADDER.barMin * S, 2) : (LADDER.weight[w] ?? LADDER.weight.line) * k);
  const opacityOf = (el) => (el.fill === 'ghost' ? LADDER.ghost : 1);
  const defs = []; const layers = Object.fromEntries(LAYER_ORDER.map((l) => [l, []]));
  const fonts = (spec.fonts || []).map((ft) => `@font-face{font-family:'${esc(ft.family)}';src:url(${resolve(ft.src)});font-weight:${ft.weight || 400};font-style:normal}`).join('');
  const fontStack = (role) => { const own = (spec.fonts || []).filter((ft) => (ft.role || 'display') === role).map((ft) => `'${ft.family}'`); return [...own, FONT_FALLBACK[role] || FONT_FALLBACK.text].join(','); };
  let uid = 0; const nid = (p) => `${id}-${p}-${uid++}`;
  const stroke = (el, col) => `stroke="${col}" stroke-width="${f(wpx(el.weight))}"`;
  const dash = (el) => (el.dash ? ` stroke-dasharray="${typeof el.dash === 'string' ? el.dash : `${f(2 * k)} ${f(6 * k)}`}"` : '');
  // The odd member of a repeating element (anomaly, SKL-17): looked up by member index; it overrides one attribute of its group.
  const oddOf = (el) => new Map([].concat(el.anomaly || []).filter((a) => a.index >= 0).map((a) => [a.index, a]));
  const inkOf = (o, col) => (o && o.ink ? colorOf(o.ink, pal) : col);
  const oddTag = (o) => (o ? ` data-odd="${o.index}"` : '');
  const oddStroke = (o) => (o ? `${o.ink ? ` stroke="${colorOf(o.ink, pal)}"` : ''}${o.weight ? ` stroke-width="${f(wpx(o.weight))}"` : ''}${oddTag(o)}` : '');
  const clipFor = (el) => {
    if (!el.clip) return '';
    const target = spec.elements.find((e) => e.id === el.clip); if (!target) return '';
    const cid = nid('clip'); const b = elementBox(target, W, H);
    const shape = target.kind === 'container' && target.r !== undefined ? `<circle cx="${f(target.cx)}" cy="${f(target.cy)}" r="${f(target.r)}"/>` : `<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}"/>`;
    defs.push(`<clipPath id="${cid}">${shape}</clipPath>`); return ` clip-path="url(#${cid})"`;
  };
  const tintFilter = (col) => { const fid = nid('tint'); defs.push(`<filter id="${fid}" color-interpolation-filters="sRGB"><feFlood flood-color="${col}" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in"/></filter>`); return fid; };

  const push = (layer, el, i, body) => { if (visible && !visible.has(layer)) return; layers[layer].push(withIds && el ? `<g data-el="${i}" data-kind="${el.kind}"${el.id ? ` data-id="${esc(el.id)}"` : ''}>${body}</g>` : body); };

  // Ground
  push('ground', null, -1, `<rect x="0" y="0" width="${W}" height="${H}" fill="${pal.bg}"/>`);

  spec.elements.forEach((el, i) => {
    const kind = el.kind; const layer = layerOf(el); const col = colorOf(el.ink, pal); const op = opacityOf(el);
    const solid = el.fill === 'solid';
    if (kind === 'material') {
      const b = el.box;
      if (!el.src) {
        push(layer, el, i, `<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="none" stroke="${col}" stroke-dasharray="8 5"/><text x="${f(b.x + 8)}" y="${f(b.y + 20)}" font-family="${fontStack('mono')}" font-size="14" fill="${col}">${esc(el.label || el.id || 'material')} · asset pending</text>`);
      } else {
        const [ax, ay] = el.align || [0.5, 0.5]; const names = { 0: 'Min', 0.5: 'Mid', 1: 'Max' };
        const aspect = el.fit === 'stretch' ? 'none' : `x${names[ax]}Y${names[ay]} ${el.fit === 'cover' ? 'slice' : 'meet'}`;
        const cid = nid('material-box'); defs.push(`<clipPath id="${cid}"><rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}"/></clipPath>`);
        const tint = el.tint ? ` filter="url(#${tintFilter(colorOf(el.tint, pal))})"` : '';
        const turn = el.rotate ? ` transform="rotate(${f(el.rotate)} ${f(b.x + b.w / 2)} ${f(b.y + b.h / 2)})"` : '';
        const blend = el.blend ? ` style="mix-blend-mode:${el.blend}"` : '';
        const img = `<image href="${esc(resolve(el.src))}" x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" preserveAspectRatio="${aspect}"${tint}/>`;
        // External clip is in canvas space; box clipping and rotation belong to the asset.
        push(layer, el, i, `<g opacity="${el.opacity ?? 1}"${blend}${clipFor(el)}><g${turn}><g clip-path="url(#${cid})">${img}</g></g></g>`);
      }
    } else if (kind === 'bar') push(layer, el, i, `<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" fill="${col}" opacity="${op}"${clipFor(el)}/>`);
    else if (kind === 'block') push(layer, el, i, `<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" fill="${solid || el.fill === 'ghost' ? col : 'none'}" opacity="${op}" ${solid || el.fill === 'ghost' ? '' : stroke(el, col)}${clipFor(el)}/>`);
    else if (kind === 'frame') push(layer, el, i, `<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" fill="none" ${stroke(el, col)} opacity="${op}"${dash(el)}/>`);
    else if (kind === 'container') {
      const fillAttr = solid || el.fill === 'ghost' ? `fill="${col}" opacity="${op}"` : `fill="none" ${stroke(el, col)} opacity="${op}"${dash(el)}`;
      if (el.shape === 'circle' || el.r !== undefined) push(layer, el, i, `<circle cx="${f(el.cx)}" cy="${f(el.cy)}" r="${f(el.r)}" ${fillAttr}/>`);
      else if (el.shape === 'arch') push(layer, el, i, `<path d="M${f(el.x)},${f(el.y + el.h)} V${f(el.y + el.w / 2)} A${f(el.w / 2)},${f(el.w / 2)} 0 0 1 ${f(el.x + el.w)},${f(el.y + el.w / 2)} V${f(el.y + el.h)} Z" ${fillAttr}/>`);
      else push(layer, el, i, `<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" ${fillAttr}/>`);
    } else if (kind === 'subject') {
      const b = el.box; const levels = el.levels || [];
      const withSrc = levels.filter((l) => l.src);
      if (!withSrc.length) {
        // No asset yet: a flat placeholder silhouette so the composition can still be judged for mass.
        const pid = nid('hatch'); defs.push(`<pattern id="${pid}" width="${f(10 * k)}" height="${f(10 * k)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${f(10 * k)}" height="${f(2.5 * k)}" fill="${col}"/></pattern>`);
        push(layer, el, i, `<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="url(#${pid})" opacity="${el.placeholder === 'ghost' ? 0.3 : 0.55}"/><rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="none" stroke="${col}" stroke-width="${f(wpx('line'))}"/><text x="${f(b.x + 12)}" y="${f(b.y + 28)}" font-family="${fontStack('mono')}" font-size="${f(12 * k)}" fill="${col}" stroke="${pal.bg}" stroke-width="${f(4 * k)}" paint-order="stroke">${esc(el.label || el.id || 'subject')} · asset pending</text>`);
      } else {
        const parts = [];
        for (const lv of withSrc) {
          const asset = opts.assets?.[lv.src]; const T = subjectTransform(lv.box ? { ...el, box: lv.box, fit: lv.fit || el.fit, align: lv.align || el.align } : el, asset);
          const off = lv.offset || [0, 0]; const lvScale = lv.scale || 1; const cxl = T.tx + T.aw * T.sx / 2, cyl = T.ty + T.ah * T.sy / 2; const extraT = (lv.mirror || lv.rotate || lv.scale) ? ` transform="translate(${f(cxl)},${f(cyl)}) rotate(${lv.rotate || 0}) scale(${lv.mirror ? -lvScale : lvScale},${lvScale}) translate(${f(-cxl)},${f(-cyl)})"` : ''; const tint = lv.tint ? ` filter="url(#${tintFilter(colorOf(lv.tint, pal))})"` : '';
          const opa = lv.opacity ?? (lv.mode === 'ghost' ? LADDER.ghost : 1);
          const blend = lv.blend ? ` style="mix-blend-mode:${lv.blend}"` : '';
          const clip = lv.clip ? clipFor({ clip: lv.clip }) : '';
          const img = `<image href="${esc(resolve(lv.src))}" x="0" y="0" width="${f(T.aw)}" height="${f(T.ah)}" preserveAspectRatio="none"${tint}/>`;
          parts.push(`<g${clip}><g${extraT}><g transform="translate(${f(T.tx + off[0])},${f(T.ty + off[1])}) scale(${f(T.sx)},${f(T.sy)})" opacity="${opa}"${blend}>${img}</g></g></g>`); // clip lives in canvas space, outside the image transform
        }
        push(layer, el, i, parts.join(''));
      }
    } else if (kind === 'lines') { const odd = oddOf(el); push(layer, el, i, lineFamily(el, W, H).map(([x1, y1, x2, y2], j) => { const o = odd.get(j); return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${stroke(o?.weight ? o : el, inkOf(o, col))} opacity="${op}"${dash(el)}${oddTag(o)}/>`; }).join('')); }
    else if (kind === 'line') { const [x1, y1, x2, y2] = el.extend === false ? [el.x1, el.y1, el.x2, el.y2] : extendLine(el.x1, el.y1, el.x2, el.y2, W, H); push(layer, el, i, `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${stroke(el, col)} opacity="${op}"${dash(el)}/>`); }
    else if (kind === 'horizon') { const y = horizonY(el, H); push(layer, el, i, `<line x1="${-40}" y1="${f(y)}" x2="${W + 40}" y2="${f(y)}" ${stroke(el, col)} opacity="${op}"${el.dash === false ? '' : ` stroke-dasharray="${f(2 * k)} ${f(6 * k)}"`}/>`); }
    else if (kind === 'rings') { const ws = el.weights || [], odd = oddOf(el); push(layer, el, i, (el.radii || []).map((r, j) => { const o = odd.get(j); return `<circle cx="${f(el.cx)}" cy="${f(el.cy)}" r="${f(r)}" fill="none" stroke="${inkOf(o, col)}" stroke-width="${f(wpx(o?.weight || ws[j] || el.weight))}" opacity="${op}"${dash(el)}${oddTag(o)}/>`; }).join('')); }
    else if (kind === 'radial') { const n = el.count || 48, every = el.every || 6, extra = el.extra ?? 1.1; const out = [], odd = oddOf(el); for (let j = 0; j < n; j++) { const a = radialAngle(el, j, n), q = odd.get(j); const far = j % every === 0 ? el.outer * extra : el.outer; const o = q?.size ? el.inner + (far - el.inner) * q.size : far; out.push(`<line x1="${f(el.cx + el.inner * Math.cos(a))}" y1="${f(el.cy + el.inner * Math.sin(a))}" x2="${f(el.cx + o * Math.cos(a))}" y2="${f(el.cy + o * Math.sin(a))}"${oddStroke(q)}/>`); } push(layer, el, i, `<g ${stroke(el, col)} opacity="${op}">${out.join('')}</g>`); }
    else if (kind === 'orbit') push(layer, el, i, `<ellipse cx="${f(el.cx)}" cy="${f(el.cy)}" rx="${f(el.rx)}" ry="${f(el.ry)}" transform="rotate(${el.tilt || 0} ${f(el.cx)} ${f(el.cy)})" fill="${solid ? col : 'none'}" ${solid ? '' : stroke(el, col)} opacity="${op}"${dash(el)}/>`);
    else if (kind === 'rhythm') {
      const n = el.count || 6, ratio = el.ratio || 1.5, start = el.start || 4, ts = rhythmStops(el), odd = oddOf(el);
      push(layer, el, i, ts.map((u, j) => { const o = odd.get(j), c = inkOf(o, col); const [x, y] = alongPoly(el.path, u); const rr = start * Math.pow(ratio, el.reverse ? n - 1 - j : j) * (o?.size ?? 1); return (o?.fill ? o.fill === 'solid' : solid) ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${c}" opacity="${op}"${oddTag(o)}/>` : `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="none" ${stroke(o?.weight ? o : el, c)} opacity="${op}"${oddTag(o)}/>`; }).join(''));
    } else if (kind === 'trail') {
      const n = el.count || 8, r = rng(el.seed || 3), [s0, s1] = el.size || [6, 24], taper = el.taper || 'away', shape = el.shape || (el.src ? 'image' : 'shard');
      const asset = el.src ? opts.assets?.[el.src] : null; const out = [];
      for (let j = 0; j < n; j++) {
        const u = (j + 0.5) / n; const [x, y, a] = alongPoly(el.path, u); const g = taper === 'away' ? 1 - u : taper === 'toward' ? u : 0.5; const s = s0 + (s1 - s0) * Math.pow(g, 1.2);
        const jx = (r() - 0.5) * (el.spread || 40), jy = (r() - 0.5) * (el.spread || 40) * 0.6; const rot = a * 180 / Math.PI + (r() - 0.5) * 50; const cx = x + jx, cy = y + jy;
        if (shape === 'image' && el.src) { const aw = asset?.w || 100, ah = asset?.h || 100; const sc = s / Math.max(aw, ah); out.push(`<g transform="translate(${f(cx)},${f(cy)}) rotate(${f(rot)}) scale(${f(sc)}) translate(${f(-aw / 2)},${f(-ah / 2)})"><image href="${esc(resolve(el.src))}" width="${aw}" height="${ah}"${el.tint === false ? '' : ` filter="url(#${tintFilter(col)})`}/></g>`); }
        else if (shape === 'star') out.push(`<path d="${starPath(cx, cy, s, el.sharp, el.aspect, el.straight)}" fill="${col}"/>`);
        else if (shape === 'dot') out.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s / 2)}" fill="${col}"/>`);
        else out.push(`<rect x="${f(cx - s / 2)}" y="${f(cy - s / 5)}" width="${f(s)}" height="${f(s / 2.5)}" transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})" fill="${col}"/>`);
      }
      push(layer, el, i, `<g opacity="${op}">${out.join('')}</g>`);
    } else if (kind === 'mark') {
      const s = el.size || 16;
      if (el.shape === 'dot') push(layer, el, i, `<circle cx="${f(el.x)}" cy="${f(el.y)}" r="${f(s / 2)}" fill="${col}" opacity="${op}"/>`);
      else if (el.shape === 'cross') push(layer, el, i, `<path d="M${f(el.x - s / 2)},${f(el.y)} H${f(el.x + s / 2)} M${f(el.x)},${f(el.y - s / 2)} V${f(el.y + s / 2)}" stroke="${col}" stroke-width="${f(wpx('line'))}" opacity="${op}"/>`);
      else if (el.shape === 'ring') push(layer, el, i, `<circle cx="${f(el.x)}" cy="${f(el.y)}" r="${f(s / 2)}" fill="none" ${stroke(el, col)} opacity="${op}"/>`);
      else push(layer, el, i, `<g opacity="${op}">${starMark(el.x, el.y, s, el, col, el.innerInk ? colorOf(el.innerInk, pal) : col, wpx(el.outline === true ? 'line' : el.outline || 'line'))}</g>`);
    } else if (kind === 'soft') {
      const fid = nid('soft'); const blur = el.blur ?? Math.max(6, Math.min(el.w, el.h) * 0.3); defs.push(`<filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(blur)}"/></filter>`);
      const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
      push(layer, el, i, `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(el.w / 2)}" ry="${f(el.h / 2)}" transform="rotate(${el.angle || 0} ${f(cx)} ${f(cy)})" fill="${col}" opacity="${el.opacity ?? LADDER.softOpacity}" filter="url(#${fid})"/>`);
    } else if (kind === 'rule') push(layer, el, i, `<line x1="${f(el.x1)}" y1="${f(el.y1)}" x2="${f(el.x2)}" y2="${f(el.y2)}" stroke="${col}" stroke-width="${f(el.width || wpx(el.weight))}" opacity="${op}"/>`);
    else if (kind === 'type') {
      const b = el.box, role = el.role || 'voice'; const vert = el.orientation === 'vertical';
      const text = [].concat(el.text || '');
      if (role === 'plane') {
        const str = text.join(''); const fam = fontStack(el.font || 'display');
        const size = el.size || (vert ? Math.min(b.w * 1.05, b.h / Math.max(str.length, 1) * 1.1) : Math.min(b.h * 0.95, b.w / Math.max(str.length, 1) * 1.15));
        const sx = el.stretch?.[0] ?? 1, sy = el.stretch?.[1] ?? 1; const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        const anchor = el.align === 'left' ? 'start' : el.align === 'right' ? 'end' : 'middle'; const ax = el.align === 'left' ? b.x : el.align === 'right' ? b.x + b.w : cx;
        const outline = el.fill === 'outline' ? `fill="none" stroke="${col}" stroke-width="${f(wpx(el.weight))}"` : `fill="${col}"`;
        const lines = vert ? [str] : text;
        const lh = (el.lineHeight || 1) * size;
        const cjk = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(str);
        const vmode = vert ? (el.vertical || (cjk ? 'stack' : 'rotate')) : null; // stack: upright glyphs top-down (CJK); rotate: the word turned 90° (Latin)
        let body;
        if (vmode === 'rotate' || vmode === 'rotate-ccw') { const vsize = el.size || Math.min(b.w * 0.95, b.h / Math.max(str.length, 1) * 1.6); const dir = el.vertical === 'rotate-ccw' ? -90 : 90; body = `<text transform="rotate(${dir} ${f(cx)} ${f(cy)})" x="${f(cx)}" y="${f(cy)}" font-family="${fam}" font-weight="${el.weightCss || 700}" font-size="${f(vsize)}" letter-spacing="${el.tracking ? f(el.tracking * vsize) : 0}" ${outline} opacity="${op}" text-anchor="middle" dominant-baseline="central">${esc(str)}</text>`; }
        else body = lines.map((t, j) => `<text x="${f(ax)}" y="${f(vert ? b.y : cy - (lines.length - 1) * lh / 2 + j * lh)}" font-family="${fam}" font-weight="${el.weightCss || 700}" font-size="${f(size)}" letter-spacing="${el.tracking ? f(el.tracking * size) : 0}" ${outline} opacity="${op}" text-anchor="${vert ? 'start' : anchor}" dominant-baseline="${vert ? 'auto' : 'central'}"${vert ? ` writing-mode="vertical-rl" style="writing-mode:vertical-rl;text-orientation:upright" x="${f(cx)}"` : ''}>${esc(t)}</text>`).join('');
        push(layer, el, i, `<g transform="translate(${f(ax)},${f(cy)}) scale(${sx},${sy}) translate(${f(-ax)},${f(-cy)})"${clipFor(el)}>${body}</g>`);
      } else if (role === 'mark') {
        const size = el.size || 11 * k; const fam = fontStack(el.font || 'mono'); const anchor = el.align === 'right' ? 'end' : el.align === 'center' ? 'middle' : 'start'; const x = anchor === 'end' ? b.x + b.w : anchor === 'middle' ? b.x + b.w / 2 : b.x;
        const t = text.join(' '); const up = el.upper === false ? t : t.replace(/[a-z]/g, (c) => c.toUpperCase());
        push(layer, el, i, vert ? `<text x="${f(b.x + b.w / 2)}" y="${f(b.y)}" font-family="${fam}" font-size="${f(size)}" letter-spacing="${f((el.tracking ?? 0.28) * size)}" fill="${col}" opacity="${op}" writing-mode="vertical-rl" style="writing-mode:vertical-rl">${esc(up)}</text>` : `<text x="${f(x)}" y="${f(b.y + b.h / 2)}" font-family="${fam}" font-size="${f(size)}" letter-spacing="${f((el.tracking ?? 0.28) * size)}" fill="${col}" opacity="${op}" text-anchor="${anchor}" dominant-baseline="central">${esc(up)}</text>`);
      } else {
        const size = el.size || 18 * k; const fam = fontStack(el.font || 'text'); const lh = (el.lineHeight || 1.55) * size; const anchor = el.align === 'right' ? 'end' : el.align === 'center' ? 'middle' : 'start'; const x = anchor === 'end' ? b.x + b.w : anchor === 'middle' ? b.x + b.w / 2 : b.x;
        push(layer, el, i, text.map((t, j) => `<text x="${f(x)}" y="${f(b.y + size + j * lh)}" font-family="${fam}" font-size="${f(size)}" letter-spacing="${f((el.tracking ?? 0.04) * size)}" fill="${col}" opacity="${op}" text-anchor="${anchor}">${esc(t)}</text>`).join(''));
      }
    } else if (kind === 'field') {
      // A plane made of texture: rect, circle, band or polygon filled with a procedural pattern (SKL-16).
      const pid = nid('field'); const cell = (el.cell || 8) * k; const pat = el.pattern || 'dots'; const sc = el.scale || 1; const c = cell * sc; const inkC = col; const rot = el.angle || 0;
      let body = '';
      if (pat === 'dots') body = `<circle cx="${f(c / 2)}" cy="${f(c / 2)}" r="${f(c * (el.density || 0.22))}" fill="${inkC}"/>`;
      else if (pat === 'halftone') body = `<circle cx="${f(c / 2)}" cy="${f(c / 2)}" r="${f(c * (el.density || 0.3))}" fill="${inkC}"/><circle cx="0" cy="0" r="${f(c * (el.density || 0.3) * 0.6)}" fill="${inkC}"/><circle cx="${f(c)}" cy="${f(c)}" r="${f(c * (el.density || 0.3) * 0.6)}" fill="${inkC}"/>`;
      else if (pat === 'hatch') body = `<rect width="${f(c)}" height="${f(c * (el.density || 0.18))}" fill="${inkC}"/>`;
      else if (pat === 'grid') body = `<rect width="${f(c)}" height="${f(wpx('hairline'))}" fill="${inkC}"/><rect width="${f(wpx('hairline'))}" height="${f(c)}" fill="${inkC}"/>`;
      else if (pat === 'cross') body = `<path d="M${f(c / 2)},${f(c * 0.2)} V${f(c * 0.8)} M${f(c * 0.2)},${f(c / 2)} H${f(c * 0.8)}" stroke="${inkC}" stroke-width="${f(wpx('hairline'))}"/>`;
      else if (pat === 'rings') body = `<circle cx="${f(c / 2)}" cy="${f(c / 2)}" r="${f(c * 0.36)}" fill="none" stroke="${inkC}" stroke-width="${f(wpx('hairline'))}"/>`;
      else if (pat === 'waves') body = `<path d="M0,${f(c * 0.5)} Q${f(c * 0.25)},${f(c * 0.1)} ${f(c * 0.5)},${f(c * 0.5)} T${f(c)},${f(c * 0.5)}" fill="none" stroke="${inkC}" stroke-width="${f(wpx('hairline') * 1.4)}"/>`;
      else if (pat === 'tiles') body = `<rect x="${f(c * 0.08)}" y="${f(c * 0.08)}" width="${f(c * 0.84)}" height="${f(c * 0.84)}" fill="none" stroke="${inkC}" stroke-width="${f(wpx('line'))}"/><circle cx="${f(c / 2)}" cy="${f(c * 0.08)}" r="${f(c * 0.14)}" fill="${inkC}"/>`;
      else if (pat === 'stars') body = `<path d="${starPath(c / 2, c / 2, c * 0.5, el.sharp ?? 0.14, el.aspect ?? 1)}" fill="${inkC}"/>`;
      else if (pat === 'noise') { const r = rng(el.seed || 5); for (let j = 0; j < 24; j++) body += `<rect x="${f(r() * c)}" y="${f(r() * c)}" width="${f(1 * k + r() * 1.2 * k)}" height="${f(1 * k + r() * 1.2 * k)}" fill="${inkC}"/>`; }
      else body = `<rect width="${f(c)}" height="${f(c)}" fill="${inkC}"/>`;
      // halftone gradient: dot radius grows along the field; emulate with 4 bands of increasing density
      defs.push(`<pattern id="${pid}" width="${f(c)}" height="${f(c)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">${body}</pattern>`);
      const shape = el.shape || (el.r !== undefined ? 'circle' : 'rect');
      let geo;
      if (shape === 'circle') geo = `<circle cx="${f(el.cx)}" cy="${f(el.cy)}" r="${f(el.r)}"`;
      else if (shape === 'polygon' && el.points) geo = `<polygon points="${el.points.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')}"`;
      else if (shape === 'star') geo = `<path d="${starPath(el.cx, el.cy, el.size, el.sharp ?? 0.12, el.aspect)}"`;
      else geo = `<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}"`;
      const base = el.base ? `${geo} fill="${colorOf(el.base, pal)}"/>` : '';
      push(layer, el, i, `${base}${geo} fill="url(#${pid})" opacity="${op}"${clipFor(el)}/>${el.outline ? `${geo} fill="none" ${stroke({ weight: el.outline }, col)}/>` : ''}`);
    } else if (kind === 'sweep') {
      // A tapered brush arc: thick at `from`, thin at `to`, bulging to `width` in the middle. Plane weight ink.
      const pts = sampleSmooth(el.path, 24); if (pts.length < 2) return; const wmax = el.width || 24 * k; const L = polyLength(pts); const left = [], right = [];
      let acc = 0;
      for (let j = 0; j < pts.length; j++) { if (j) acc += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]); const u = acc / L; const prof = el.taper === 'end' ? 1 - u : el.taper === 'start' ? u : Math.sin(u * Math.PI); const wv = Math.max(0.4, wmax * Math.pow(prof, el.power || 0.8)); const n = j < pts.length - 1 ? [pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]] : [pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]]; const len = Math.hypot(n[0], n[1]) || 1; const nx = -n[1] / len, ny = n[0] / len; left.push([pts[j][0] + nx * wv / 2, pts[j][1] + ny * wv / 2]); right.push([pts[j][0] - nx * wv / 2, pts[j][1] - ny * wv / 2]); }
      const poly = [...left, ...right.reverse()].map((p) => `${f(p[0])},${f(p[1])}`).join(' ');
      push(layer, el, i, `<polygon points="${poly}" fill="${col}" opacity="${op}"${clipFor(el)}/>`);
    } else if (kind === 'ticks') {
      // Ruler ticks: around a circle (cx cy r) or along a line (x1 y1 x2 y2). Every `every`-th tick is longer.
      const n = el.count || 60, len = el.len || 10 * k, every = el.every || 5, extra = el.extra || 2, out = [], odd = oddOf(el);
      if (el.r !== undefined) { for (let j = 0; j < n; j++) { const a = ringAngle(el, j, n), o = odd.get(j); const L2 = (j % every === 0 ? len * extra : len) * (o?.size ?? 1); const r0 = el.inside ? el.r - L2 : el.r; out.push(`<line x1="${f(el.cx + r0 * Math.cos(a))}" y1="${f(el.cy + r0 * Math.sin(a))}" x2="${f(el.cx + (r0 + L2) * Math.cos(a))}" y2="${f(el.cy + (r0 + L2) * Math.sin(a))}"${oddStroke(o)}/>`); } }
      else { const dx = el.x2 - el.x1, dy = el.y2 - el.y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; for (let j = 0; j < n; j++) { const t = n === 1 ? 0 : j / (n - 1), o = odd.get(j); const x = el.x1 + dx * t, y = el.y1 + dy * t; const L2 = (j % every === 0 ? len * extra : len) * (o?.size ?? 1); const side = el.side === 'both' ? -1 : 0; out.push(`<line x1="${f(x + nx * L2 * side)}" y1="${f(y + ny * L2 * side)}" x2="${f(x + nx * L2)}" y2="${f(y + ny * L2)}"${oddStroke(o)}/>`); } }
      push(layer, el, i, `<g ${stroke(el, col)} opacity="${op}" stroke-linecap="butt">${out.join('')}</g>`);
    } else if (kind === 'arc') {
      const a0 = (el.start ?? 0) * Math.PI / 180, a1 = (el.end ?? 180) * Math.PI / 180; const big = Math.abs(a1 - a0) > Math.PI ? 1 : 0; const sw = a1 > a0 ? 1 : 0;
      const d = `M${f(el.cx + el.r * Math.cos(a0))},${f(el.cy + el.r * Math.sin(a0))} A${f(el.r)},${f(el.r)} 0 ${big} ${sw} ${f(el.cx + el.r * Math.cos(a1))},${f(el.cy + el.r * Math.sin(a1))}`;
      if (el.dots) { const n = el.dots, odd = oddOf(el); const out = []; for (let j = 0; j <= n; j++) { const a = arcAngle(el, j, n), o = odd.get(j); out.push(`<circle cx="${f(el.cx + el.r * Math.cos(a))}" cy="${f(el.cy + el.r * Math.sin(a))}" r="${f((el.dot || 3) * k * (o?.size ?? 1))}" fill="${inkOf(o, col)}"${oddTag(o)}/>`); } push(layer, el, i, `<g opacity="${op}">${out.join('')}</g>`); }
      else push(layer, el, i, `<path d="${d}" fill="none" ${stroke(el, col)} opacity="${op}"${dash(el)} stroke-linecap="round"/>`);
    } else if (kind === 'system') {
      // An ordered system (SKL-17): one shape, one large path, one size rule. Even spacing by default; size grows monotonically (`grow: up|down|bulge`) or stays; `phases: true` runs the moon from new to full to new.
      const n = el.count || 9, shape = el.shape || 'dot', shapes = el.shapes || [shape], size = el.size || 16 * k, sizes = el.sizes || [1, 1]; const r = rng(el.seed || 9); const pts = systemPoints(el, n); const out = [], odd = oddOf(el), late = [];
      pts.forEach(([x, y, a, u], j) => { const o = odd.get(j); const jit = el.jitter ? (r() - 0.5) * el.jitter * size : 0; const prof = el.grow === 'up' ? u : el.grow === 'down' ? 1 - u : el.grow === 'bulge' ? Math.sin(u * Math.PI) : el.grow === 'steps' ? Math.floor(u * 4) / 3 : 1; const sz = size * (sizes[0] + (sizes[1] - sizes[0]) * prof) * (o?.size ?? 1); const ph = el.phases ? (el.phases === 'half' ? u * 0.5 : u) : 0.5; const rot = (el.align ? a * 180 / Math.PI + (el.rotate || 0) : (el.rotate || 0)) + (o?.rotate || 0);
        const g = glyphSvg(o?.shape || shapes[j % shapes.length], x + jit, y + jit, sz, rot, inkOf(o, col), wpx(o?.weight || 'line'), ph, el, opts, resolve, tintFilter);
        if (o) late.push(`<g data-odd="${j}">${g}</g>`); else out.push(g); }); // the odd member is drawn last, above its neighbours
      const guide = el.guide ? (el.rx !== undefined ? `<ellipse cx="${f(el.cx)}" cy="${f(el.cy)}" rx="${f(el.rx)}" ry="${f(el.ry ?? el.rx)}" transform="rotate(${el.tilt || 0} ${f(el.cx)} ${f(el.cy)})" fill="none" stroke="${col}" stroke-width="${f(wpx(el.guide === true ? 'hairline' : el.guide))}"${el.guideDash ? ' stroke-dasharray="4 6"' : ''}/>` : `<path d="${smoothPath(el.path)}" fill="none" stroke="${col}" stroke-width="${f(wpx(el.guide === true ? 'hairline' : el.guide))}"${el.guideDash ? ' stroke-dasharray="4 6"' : ''}/>`) : '';
      push(layer, el, i, `<g opacity="${op}">${guide}${out.join('')}${late.join('')}</g>`);
    } else if (kind === 'glyphs') {
      // Shapes cycling along a path (phases, stars, drops, crosses, dots, shards): fragments with an alphabet (SKL-10).
      const n = el.count || 9, shapes = el.shapes || ['phase', 'star', 'dot'], size = el.size || 16 * k, r = rng(el.seed || 9), out = []; const sizes = el.sizes || [0.6, 1];
      for (let j = 0; j < n; j++) { const u = el.jitter ? (j + 0.5 + (r() - 0.5) * el.jitter) / n : (j + 0.5) / n; const [x, y, a] = alongPoly(el.path, Math.max(0, Math.min(1, u))); const sh = shapes[j % shapes.length]; const s = size * (sizes[0] + (sizes[1] - sizes[0]) * (el.grow === 'start' ? 1 - u : el.grow === 'end' ? u : r())); const ph = (j % 4) / 4; const rot = el.align ? a * 180 / Math.PI : 0; const g = `transform="rotate(${f(rot)} ${f(x)} ${f(y)})"`;
        if (sh === 'phase') { const R = s / 2; const inner = [0.9, 0.55, 0.2, -0.3][j % 4] * R; out.push(`<path ${g} d="M${f(x)},${f(y - R)} A${f(R)},${f(R)} 0 0 1 ${f(x)},${f(y + R)} A${f(Math.max(0.01, Math.abs(inner)))},${f(R)} 0 0 ${inner > 0 ? 1 : 0} ${f(x)},${f(y - R)} Z" fill="${col}"/>`); }
        else if (sh === 'star') out.push(`<path d="${starPath(x, y, s, el.sharp, el.aspect, el.straight)}" fill="${col}"/>`);
        else if (sh === 'dot') out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="${col}"/>`);
        else if (sh === 'ring') out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(s / 2)}" fill="none" stroke="${col}" stroke-width="${f(wpx('line'))}"/>`);
        else if (sh === 'cross') out.push(`<path ${g} d="M${f(x - s / 2)},${f(y)} H${f(x + s / 2)} M${f(x)},${f(y - s / 2)} V${f(y + s / 2)}" stroke="${col}" stroke-width="${f(wpx('line'))}"/>`);
        else if (sh === 'drop') out.push(`<path ${g} d="M${f(x)},${f(y - s / 2)} C${f(x + s / 2)},${f(y + s * 0.1)} ${f(x + s / 3)},${f(y + s / 2)} ${f(x)},${f(y + s / 2)} C${f(x - s / 3)},${f(y + s / 2)} ${f(x - s / 2)},${f(y + s * 0.1)} ${f(x)},${f(y - s / 2)} Z" fill="${col}"/>`);
        else if (sh === 'shard') out.push(`<rect ${g} x="${f(x - s / 2)}" y="${f(y - s / 6)}" width="${f(s)}" height="${f(s / 3)}" fill="${col}"/>`);
        else if (sh === 'tri') out.push(`<path ${g} d="M${f(x)},${f(y - s / 2)} L${f(x + s / 2)},${f(y + s / 2)} L${f(x - s / 2)},${f(y + s / 2)} Z" fill="${col}"/>`);
        else if (sh === 'image' && el.src) { const asset = opts.assets?.[el.src]; const aw = asset?.w || 100, ah = asset?.h || 100; const sc = s / Math.max(aw, ah); out.push(`<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${f(sc)}) translate(${f(-aw / 2)},${f(-ah / 2)})"><image href="${esc(resolve(el.src))}" width="${aw}" height="${ah}"${el.tint === false ? '' : ` filter="url(#${tintFilter(col)})`}/></g>`); } }
      push(layer, el, i, `<g opacity="${op}">${out.join('')}</g>`);
    } else if (kind === 'blob') {
      // An organic ink or signal splotch: a noisy closed curve. The hard-edged cousin of the soft element.
      const r = rng(el.seed || 21), n = el.points || 14, R = el.r || 40 * k, pts = []; const rough = el.rough ?? 0.35;
      for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2; const rr = R * (1 - rough / 2 + r() * rough) * (el.stretch ? (1 + (el.stretch - 1) * Math.abs(Math.cos(a))) : 1); pts.push([el.cx + rr * Math.cos(a), el.cy + rr * Math.sin(a)]); }
      pts.push(pts[0], pts[1]);
      const blurAttr = el.blur ? (() => { const fid = nid('blobblur'); defs.push(`<filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(el.blur)}"/></filter>`); return ` filter="url(#${fid})"`; })() : '';
      push(layer, el, i, `<path d="${smoothPath(pts)} Z" fill="${col}" opacity="${el.opacity ?? op}" transform="rotate(${el.angle || 0} ${f(el.cx)} ${f(el.cy)})"${blurAttr}/>`);
    } else if (kind === 'ribbon') {
      // A brush stroke along a path with varying width; `blur` makes it the soft element (TEX-2), otherwise hard.
      const pts = sampleSmooth(el.path, 20); if (pts.length < 2) return; const wmax = el.width || 40 * k; const L = polyLength(pts); const r = rng(el.seed || 4); const left = [], right = []; let acc = 0;
      for (let j = 0; j < pts.length; j++) { if (j) acc += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]); const u = acc / L; const prof = Math.sin(Math.min(1, u * 1.15) * Math.PI) ** 0.5; const wob = 1 + (r() - 0.5) * (el.wobble ?? 0.5); const wv = Math.max(1, wmax * prof * wob); const n = j < pts.length - 1 ? [pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]] : [pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]]; const len = Math.hypot(n[0], n[1]) || 1; const nx = -n[1] / len, ny = n[0] / len; left.push([pts[j][0] + nx * wv / 2, pts[j][1] + ny * wv / 2]); right.push([pts[j][0] - nx * wv / 2, pts[j][1] - ny * wv / 2]); }
      const d = `${smoothPath(left)} L${f(right[right.length - 1][0])},${f(right[right.length - 1][1])} ${smoothPath(right.reverse()).replace(/^M[^ ]+ ?/, '')} Z`;
      const blurAttr = el.blur ? (() => { const fid = nid('ribbon'); defs.push(`<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${f(el.blur)}"/></filter>`); return ` filter="url(#${fid})"`; })() : '';
      push(layer, el, i, `<path d="${d}" fill="${col}" opacity="${el.opacity ?? (el.blur ? LADDER.softOpacity : op)}"${blurAttr}${clipFor(el)}/>`);
    } else if (kind === 'tag') {
      // A label lockup: mark type knocked out of a small ink box (edge discipline, TYP-4).
      const size = el.size || 11 * k; const fam = fontStack(el.font || 'mono'); const t = [].concat(el.text || '').join(' '); const up = el.upper === false ? t : t.replace(/[a-z]/g, (c) => c.toUpperCase()); const padX = el.pad ?? size * 0.9; const est = [...up].reduce((a, ch) => a + (/[\u3000-\u9fff\uf900-\ufaff]/.test(ch) ? 1.1 : 0.62) * size + (el.tracking ?? 0.22) * size, 0); const w = el.w || (est + padX * 2), h = el.h || size * 2;
      push(layer, el, i, `<g transform="rotate(${el.angle || 0} ${f(el.x)} ${f(el.y)})"><rect x="${f(el.x)}" y="${f(el.y)}" width="${f(w)}" height="${f(h)}" fill="${col}"/><text x="${f(el.x + padX)}" y="${f(el.y + h / 2)}" font-family="${fam}" font-size="${f(size)}" letter-spacing="${f((el.tracking ?? 0.22) * size)}" fill="${el.ink === 'bg' ? pal.fg : pal.bg}" dominant-baseline="central">${esc(up)}</text></g>`);
    } else if (kind === 'grid') {
      // A coordinate grid inside a box (Technical register apparatus).
      const cols = el.cols || 8, rows = el.rows || 6, out = []; for (let c = 0; c <= cols; c++) { const x = el.x + el.w * c / cols; out.push(`<line x1="${f(x)}" y1="${f(el.y)}" x2="${f(x)}" y2="${f(el.y + el.h)}"/>`); } for (let rr = 0; rr <= rows; rr++) { const y = el.y + el.h * rr / rows; out.push(`<line x1="${f(el.x)}" y1="${f(y)}" x2="${f(el.x + el.w)}" y2="${f(y)}"/>`); }
      push(layer, el, i, `<g ${stroke(el, col)} opacity="${op}"${dash(el)}>${out.join('')}</g>`);
    } else if (kind === 'quiet') { /* not drawn in the final */ }
  });

  // Overlay finish (TEX-1)
  const fin = spec.finish || {}; const ov = fin.overlay || 'none'; const ovOp = fin.opacity ?? 0.06;
  if (ov === 'dots') { const pid = nid('dots'); const cell = (fin.cell || 4) * k; defs.push(`<pattern id="${pid}" width="${f(cell)}" height="${f(cell)}" patternUnits="userSpaceOnUse"><circle cx="${f(cell / 2)}" cy="${f(cell / 2)}" r="${f(cell * 0.16)}" fill="${pal.fg}"/></pattern>`); push('overlay', null, -1, `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${pid})" opacity="${ovOp}"/>`); }
  else if (ov === 'grain') { const fid = nid('grain'); defs.push(`<filter id="${fid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${fin.frequency || 0.9}" numOctaves="2" stitchTiles="stitch" seed="${fin.seed || 2}"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${ovOp} 0"/></filter>`); push('overlay', null, -1, `<rect x="0" y="0" width="${W}" height="${H}" filter="url(#${fid})"/>`); }
  else if (ov === 'scan') { const pid = nid('scan'); const cell = (fin.cell || 4) * k; defs.push(`<pattern id="${pid}" width="${f(cell)}" height="${f(cell)}" patternUnits="userSpaceOnUse"><rect x="0" y="${f(cell * 0.75)}" width="${f(cell)}" height="${f(cell * 0.25)}" fill="${pal.fg}"/></pattern>`); push('overlay', null, -1, `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${pid})" opacity="${ovOp}"/>`); }

  const body = LAYER_ORDER.filter((l) => l !== 'quiet').map((l) => `<g data-layer="${l}" class="l-${l}">${layers[l].join('\n')}</g>`).join('\n');
  const clipAll = `<clipPath id="${id}-canvas"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>`;
  const extra = opts.extra || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" data-kcl="plate">
<style>${fonts}text{white-space:pre}</style>
<defs>${clipAll}${defs.join('\n')}</defs>
<g clip-path="url(#${id}-canvas)">
${body}
${extra}
</g>
</svg>`;
}

// Skeleton and flow drawn as an overlay group (for the Studio and VER-5). Colors fixed: ink wire, red flow, blue quiet.
export function wireOverlay(input, opts = {}) {
  const spec = input.__W ? input : normalizeSpec(input, opts);
  const { w: W, h: H } = spec.canvas; const C = { wire: opts.wire || '#1b1b1b', flow: '#e3261a', quiet: '#5b7fa6', station: '#e3261a' };
  const id = opts.id || 'w'; const out = [];
  const show = { skeleton: true, flow: true, boxes: true, grid: false, ...(opts.show || {}) };
  out.push(`<defs><marker id="${id}-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="${C.flow}"/></marker><marker id="${id}-entry" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6"><rect x="1" y="1" width="8" height="8" fill="none" stroke="${C.flow}" stroke-width="2"/></marker></defs>`);
  if (show.grid) { const cols = 12, m = W * 0.04, g = W * 0.02, cw = (W - 2 * m - g * (cols - 1)) / cols; for (let i = 0; i < cols; i++) out.push(`<rect x="${f(m + i * (cw + g))}" y="0" width="${f(cw)}" height="${H}" fill="${C.quiet}" opacity="0.08"/>`); for (let i = 1; i < 3; i++) { out.push(`<line x1="${f(W * i / 3)}" y1="0" x2="${f(W * i / 3)}" y2="${H}" stroke="${C.quiet}" stroke-dasharray="4 6" opacity="0.6"/><line x1="0" y1="${f(H * i / 3)}" x2="${W}" y2="${f(H * i / 3)}" stroke="${C.quiet}" stroke-dasharray="4 6" opacity="0.6"/>`); } }
  if (show.skeleton) {
    for (const el of spec.elements) {
      const k = el.kind;
      if (k === 'subject') { const b = el.box; out.push(`<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="none" stroke="${C.wire}" stroke-width="${el.rank === 1 || !el.rank ? 2 : 1.2}" stroke-dasharray="10 6"/>`); const an = el.anatomy; if (an) { const asset = opts.assets?.[(el.levels || []).find((l) => l.src)?.src]; for (const name of ['centroid', 'top', ...Object.keys(an.landmarks || {})]) { const p = resolveAnchor(el, name, asset); out.push(`<circle cx="${f(p[0])}" cy="${f(p[1])}" r="5" fill="${C.quiet}"/><text x="${f(p[0] + 8)}" y="${f(p[1] - 6)}" font-size="11" fill="${C.quiet}" font-family="sans-serif">${esc(name)}</text>`); } } }
      else if (k === 'container') { if (el.r !== undefined) out.push(`<circle cx="${f(el.cx)}" cy="${f(el.cy)}" r="${f(el.r)}" fill="none" stroke="${C.wire}" stroke-width="2"/>`); else out.push(`<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" fill="none" stroke="${C.wire}" stroke-width="2"/>`); }
      else if (k === 'bar' || k === 'block' || k === 'frame') out.push(`<rect x="${f(el.x)}" y="${f(el.y)}" width="${f(el.w)}" height="${f(el.h)}" fill="none" stroke="${C.wire}" stroke-width="1.5"/>`);
      else if (k === 'lines') for (const [x1, y1, x2, y2] of lineFamily(el, W, H)) out.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${C.wire}" stroke-width="0.8" opacity="0.7"/>`);
      else if (k === 'line') { const [x1, y1, x2, y2] = el.extend === false ? [el.x1, el.y1, el.x2, el.y2] : extendLine(el.x1, el.y1, el.x2, el.y2, W, H); out.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${C.wire}" stroke-width="0.8" opacity="0.7"/>`); }
      else if (k === 'horizon') { const y = horizonY(el, H); out.push(`<line x1="0" y1="${f(y)}" x2="${W}" y2="${f(y)}" stroke="${C.wire}" stroke-width="0.8" stroke-dasharray="2 6"/>`); }
      else if (k === 'rings') for (const r of el.radii || []) out.push(`<circle cx="${f(el.cx)}" cy="${f(el.cy)}" r="${f(r)}" fill="none" stroke="${C.wire}" stroke-width="0.8" opacity="0.7"/>`);
      else if (k === 'orbit') out.push(`<ellipse cx="${f(el.cx)}" cy="${f(el.cy)}" rx="${f(el.rx)}" ry="${f(el.ry)}" transform="rotate(${el.tilt || 0} ${f(el.cx)} ${f(el.cy)})" fill="none" stroke="${C.wire}" stroke-width="0.8"/>`);
      else if (k === 'soft') out.push(`<ellipse cx="${f(el.x + el.w / 2)}" cy="${f(el.y + el.h / 2)}" rx="${f(el.w / 2)}" ry="${f(el.h / 2)}" transform="rotate(${el.angle || 0} ${f(el.x + el.w / 2)} ${f(el.y + el.h / 2)})" fill="none" stroke="${C.wire}" stroke-dasharray="3 3"/>`);
      else if (k === 'type' && show.boxes) { const b = el.box; out.push(`<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="none" stroke="${C.wire}" stroke-width="1" stroke-dasharray="${(el.role || 'voice') === 'plane' ? '10 6' : '4 4'}"/>`); }
      else if (k === 'quiet') { const b = el.box; out.push(`<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" rx="6" fill="${C.quiet}" fill-opacity="0.08" stroke="${C.quiet}" stroke-dasharray="8 5"/>`); }
      else if (k === 'trail' || k === 'rhythm' || k === 'glyphs' || k === 'sweep' || k === 'ribbon') out.push(`<path d="${smoothPath(el.path)}" fill="none" stroke="${C.wire}" stroke-width="1" stroke-dasharray="2 4" opacity="0.8"/>`);
      else if (k === 'material' || k === 'field' || k === 'grid' || k === 'blob' || k === 'arc' || k === 'ticks') { const b = elementBox(el, W, H); out.push(`<rect x="${f(b.x)}" y="${f(b.y)}" width="${f(b.w)}" height="${f(b.h)}" fill="none" stroke="${C.wire}" stroke-width="1" stroke-dasharray="6 4" opacity="0.7"/>`); }
    }
  }
  const flow = spec.flow;
  if (show.flow && flow && flow.path) {
    const pts = flowPoints(flow);
    out.push(`<g opacity="0.92"><path d="${smoothPath(pts)}" fill="none" stroke="${C.flow}" stroke-width="3" stroke-linecap="round" marker-start="url(#${id}-entry)" marker-mid="url(#${id}-arrow)" marker-end="url(#${id}-arrow)"/>`);
    if (flow.secondary?.path) out.push(`<path d="${smoothPath(flow.secondary.path)}" fill="none" stroke="${C.flow}" stroke-width="2" stroke-dasharray="10 8"/>`);
    (flow.stations || []).forEach((s, i) => { const [x, y] = s.at; out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="13" fill="${C.station}"/><text x="${f(x)}" y="${f(y + 5)}" font-family="sans-serif" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">${i + 1}</text>`); if (s.label) out.push(`<text x="${f(x + 18)}" y="${f(y + 5)}" font-family="sans-serif" font-size="12" fill="${C.flow}" stroke="#ffffff" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${esc(s.label)}</text>`); });
    out.push('</g>');
  }
  return `<g data-layer="wire" class="l-wire">${out.join('\n')}</g>`;
}

// ---------- structural checks beyond sketch.mjs check (SKL-14, COL-6, MAT-7, SER-1, TEX-2) ----------
export function checkStructure(input, opts = {}) {
  const spec = input.__W ? input : normalizeSpec(input, opts);
  const { w: W, h: H } = spec.canvas; const S = Math.min(W, H); const warn = []; const info = { mode: compositionMode(spec) };
  const ids = new Set();
  for (const el of spec.elements) {
    if (el.id && ids.has(el.id)) warn.push(`GOV-7 duplicate element id: ${el.id}`);
    if (el.id) ids.add(el.id);
    if (el.kind === 'material' && !el.src) warn.push(`MAT-8 material ${el.id || el.label || ''}: asset pending`);
    if (el.clip && !spec.elements.some(e => e.id === el.clip)) warn.push(`SKL-1 missing clip target: ${el.clip}`);
  }
  info.materials = spec.elements.filter(e => e.kind === 'material').map(e => ({ id: e.id, src: e.src || null, layer: layerOf(e) }));
  if (info.mode === 'hybrid') {
    // Geometric/style quotas cannot evaluate drawn material. Keep actionable structural diagnostics.
    if (spec.series && !spec.series.variesBy?.length) warn.push('SER-1 系列作品未声明本张与其它张的区别');
    return { ...info, weightClasses: [], solidPlane: null, signalCarriers: [], warnings: warn };
  }
  const apparatus = spec.elements.filter((e) => ['plane', 'system', 'signal'].includes(layerOf(e)) && e.kind !== 'soft' && e.kind !== 'material');
  const classes = new Set(apparatus.map((e) => (e.fill === 'ghost' ? `${e.weight}/ghost` : e.weight)));
  info.weightClasses = [...classes];
  if (classes.size < 3) warn.push(`SKL-14 装置只有 ${classes.size} 个重量档（${[...classes].join(', ') || '无'}），至少要三档`);
  const solidPlane = spec.elements.some((e) => (['bar', 'block', 'container', 'orbit'].includes(e.kind) && e.fill === 'solid') || (e.kind === 'rings' && (e.weight === 'band' || (e.weights || []).includes('band'))));
  info.solidPlane = solidPlane;
  if (!solidPlane) warn.push('SKL-14 没有实心的面：没有 solid 的 bar / block / container，也没有 band 级的环');
  const carriers = spec.elements.filter((e) => e.ink === 'signal' && e.kind !== 'mark');
  const bigCarrier = carriers.some((e) => { const b = elementBox(e, W, H); return Math.max(b.w, b.h) >= LADDER.scale.signalCarrier * S; });
  info.signalCarriers = carriers.map((e) => e.kind);
  if (!bigCarrier) warn.push(`COL-6 信号色只出现在标点上；需要至少一个大于 ${Math.round(LADDER.scale.signalCarrier * S)}px 的信号载体（soft / rule / band / 填充容器）`);
  const softs = spec.elements.filter((e) => e.kind === 'soft'); const rendered = spec.elements.filter((e) => e.kind === 'subject' && e.render === 'rendered');
  if (rendered.length && softs.length) warn.push('MAT-7 已有保留原画材质的主体，它的脸就是唯一柔软元素；再放 soft 元素就超出 TEX-2 预算');
  for (const sub of rendered) {
    const lv = sub.levels || []; const second = lv.filter((l) => l.src && (l.mode === 'line' || l.mode === 'silhouette' || l.mode === 'threshold' || l.mode === 'halftone' || l.mode === 'negative'));
    if (!second.length) warn.push(`MAT-7 主体 ${sub.id} 保留原画，却没有第二处理层（line / silhouette / threshold）`);
    const strong = second.some((l) => (l.opacity ?? 1) >= 0.4 || Math.hypot(...(l.offset || [0, 0])) >= 0.02 * S || l.clip);
    if (second.length && !strong) warn.push(`MAT-7 主体 ${sub.id} 的第二处理层不透明度低于 0.4、偏移小于 2% 又没有被容器裁切，视觉上不存在`);
    const shifted = second.filter((l) => !l.clip && !l.box && !l.scale && Math.hypot(...(l.offset || [0, 0])) >= 0.015 * S);
    if (shifted.length) warn.push(`MAT-7 主体 ${sub.id} 的第二层只是把同一张图平移了 ${Math.round(Math.hypot(...(shifted[0].offset || [0, 0])))}px（重影）：读作套印不准，不是回声；裁进柱或窗，或缩放成另一尺寸的回声`);
    if ((sub.rank || 1) === 1 && lv.some((l) => l.mode === 'rendered' && !l.clip)) warn.push(`MAT-7 主体 ${sub.id} 以整幅原画进入（rendered 层未裁切）：默认是降解后的人物，原画只透窗留脸；整幅原画只在用户明确要求时使用`);
    const heavy = (e) => (e.weight && e.weight !== 'hairline') || (Array.isArray(e.weights) && e.weights.some((w) => w && w !== 'hairline'));
    const cutters = spec.elements.filter((e) => e !== sub && heavy(e) && ['plane', 'system'].includes(layerOf(e)) && boxesCross(elementBox(e, W, H), sub.box));
    if (!cutters.length) warn.push(`MAT-7/SKL-11 没有 line 以上重量的装置切过主体 ${sub.id}；发丝线不算穿插`);
    const trails = spec.elements.filter((e) => e.kind === 'trail'); if (trails.length && !trails.some((t) => t.src)) warn.push(`SKL-10 碎片不是主体 ${sub.id} 自己的材质（trail 没有 src）`);
  }
  for (const s of softs) if ((s.opacity ?? LADDER.softOpacity) < 0.6) warn.push(`TEX-2 软元素不透明度 ${s.opacity} 太低，看不见的软元素不算数`);
  for (const e of spec.elements) {
    if (e.kind === 'mark' && e.layer !== 'plane') { const s = e.size || 16; if (s < LADDER.scale.mark[0] * S || s > LADDER.scale.mark[1] * S) warn.push(`SKL-8 标点 ${s}px 超出 ${Math.round(LADDER.scale.mark[0] * S)}–${Math.round(LADDER.scale.mark[1] * S)}px`); }
    if (e.kind === 'container' && e.r !== undefined && !e.hidden) { const d = e.r * 2; if (d < LADDER.scale.container[0] * S || d > LADDER.scale.container[1] * S) warn.push(`SKL-5 容器直径 ${Math.round(d)}px 超出短边的 55–75%`); }
    if (e.kind === 'bar' && e.h < LADDER.barMin * S && e.w < LADDER.barMin * S) warn.push(`SKL-4 分隔条 ${e.h}px 薄于短边的 1.5%`);
  }
  // SKL-16 richness and SKL-17 order: a fixed plate is full because of a few complete ordered systems, an organic or textured plane, the subject's echo and grain, not because of many small pieces.
  const drawn = spec.elements.filter((e) => e.kind !== 'quiet' && !e.hidden);
  const famOf = { bar: 'plane', block: 'plane', frame: 'plane', container: 'plane', sweep: 'plane', field: 'field', lines: 'lines', line: 'lines', horizon: 'lines', grid: 'lines', rings: 'rings', arc: 'rings', orbit: 'rings', radial: 'rings', ticks: 'ticks', rhythm: 'rhythm', trail: 'fragments', glyphs: 'fragments', system: 'systems', mark: 'marks', soft: 'soft', blob: 'soft', ribbon: 'soft', rule: 'rules', type: 'type', tag: 'type', subject: 'subject' };
  const fam = new Set(drawn.map((e) => famOf[e.kind] || e.kind));
  const subjects = spec.elements.filter((e) => e.kind === 'subject'); const levelCount = subjects.reduce((a, s) => a + (s.levels || []).filter((l) => l.src).length, 0); const echoes = subjects.filter((e) => (e.rank || 1) > 1 || e.echo).length;
  const systems = drawn.filter((e) => e.kind === 'system' || e.kind === 'rhythm' || e.kind === 'ticks' || e.kind === 'radial' || (e.kind === 'glyphs' && !e.jitter) || (e.kind === 'trail' && !e.jitter));
  const scattered = drawn.filter((e) => (e.kind === 'glyphs' || e.kind === 'trail') && e.jitter);
  const fragmentFamilies = drawn.filter((e) => ['glyphs', 'trail', 'system'].includes(e.kind)).length;
  const lineLike = drawn.filter((e) => ['lines', 'line', 'horizon', 'orbit'].includes(e.kind)).reduce((a, e) => a + (e.kind === 'lines' ? (e.count || 1) + (e.perp || 0) : 1), 0);
  const rectFields = drawn.filter((e) => e.kind === 'field' && e.r === undefined && !e.clip && !(e.w >= 0.9 * W || e.h >= 0.9 * H)).length;
  const organic = drawn.filter((e) => ['blob', 'sweep', 'ribbon'].includes(e.kind) || (e.kind === 'field' && (e.r !== undefined || e.clip)) || (e.kind === 'bar' && (e.w >= 0.9 * W || e.h >= 0.9 * H))).length;
  const typePieces = drawn.filter((e) => e.kind === 'type' || e.kind === 'tag').length;
  info.richness = { elements: drawn.length, families: [...fam], fields: drawn.filter((e) => e.kind === 'field').length, subjectLevels: levelCount, echoes, systems: systems.length, scattered: scattered.length, fragmentFamilies, lines: lineLike, rectFields, organic, typePieces };
  if (spec.canvas && !spec.canvas.bands) {
    if (!systems.length) warn.push('SKL-17 没有一个有序系统：参照作品的秩序来自一条大路径上单调或等距重复的同一种形（月相弧、点线椭圆、放射扇）');
    if (!organic && !info.richness.fields) warn.push('SKL-16 没有有机面或纹理面：没有墨团、扫笔、通幅的带或纹理，装置只剩线和矩形');
    if (subjects.length && levelCount < 2) warn.push('SKL-16/MAT-2 主体只有一个处理层：至少要两层（线稿/剪影/阈值，或透窗保留的原画）');
    if (subjects.length && !echoes) warn.push('SKL-16 主体没有回声：参照作品里主体以剪影、镜像或缩小重复出现 1–3 次');
    if (scattered.length > 1) warn.push(`SKL-17 ${scattered.length} 个碎片家族在抖动：抖动最多给一个家族，其余按路径等距或单调排列`);
    if (fragmentFamilies > 3) warn.push(`SKL-17 ${fragmentFamilies} 个碎片/系统家族：参照作品一张至多两三个，每个走完整条路径`);
    if (lineLike > 6) warn.push(`SKL-3 ${lineLike} 根构图线：参照作品一张 3–6 根，平行或共心，连接元素而不是穿过一切`);
    if (rectFields > 2) warn.push(`SKL-16 ${rectFields} 块零散的矩形纹理面：纹理面做带的边饰、容器内部或通幅，不散放矩形`);
    if (typePieces > 5) warn.push(`TYP-7 ${typePieces} 处文字：标题、一行声部、一两个标记就够，参照作品的字很少`);
  }
  // ---------- SKL-18 line kinship: one centre, one axis ----------
  info.kinship = lineKinship(spec, opts, warn);
  if (spec.series) { info.series = spec.series; if (!spec.series.variesBy || !spec.series.variesBy.length) warn.push('SER-1 系列作品未声明本张与其它张的区别（archetype / balance / container / flow）'); }
  return { ...info, warnings: warn };
}
function boxesCross(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
const segDist = (px, py, x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L2)); return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)); };
const polyDist = (px, py, pts) => { let d = Infinity; for (let i = 1; i < pts.length; i++) d = Math.min(d, segDist(px, py, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])); return pts.length === 1 ? Math.hypot(px - pts[0][0], py - pts[0][1]) : d; };
const hausdorff = (a, b) => { const samp = (pts) => { const out = []; for (let i = 0; i <= 24; i++) { const [x, y] = alongPoly(pts, i / 24); out.push([x, y]); } return out; }; const A = samp(a), B = samp(b); let d = 0; for (const p of A) d = Math.max(d, polyDist(p[0], p[1], b)); for (const p of B) d = Math.max(d, polyDist(p[0], p[1], a)); return d; };
const ang90 = (a) => ((a % 90) + 90) % 90;
const angDiff = (a, b) => { const d = Math.abs(ang90(a) - ang90(b)); return Math.min(d, 90 - d); };
// Every line on a plate is kin to the centre (concentric, radial, tangent) or to the axis (parallel, perpendicular); the one
// gesture runs along the axis or the flow. Reports centres, angle families and gestures; warns on orphans and near-relations.
export function lineKinship(spec, opts = {}, warn = []) {
  const { w: W, h: H } = spec.canvas; const S = Math.min(W, H); const els = spec.elements.filter((e) => !e.hidden);
  const assetOf = (s) => opts.assets?.[(s.levels || []).find((l) => l.src)?.src];
  const subjects = spec.elements.filter((e) => e.kind === 'subject' && e.box);
  const marks = []; const axes = [];
  for (const sub of subjects) { const an = sub.anatomy || {}; const pts = { centroid: an.centroid || [0.5, 0.5], ...(an.landmarks || {}) };
    for (const name of Object.keys(pts)) { try { const p = resolveAnchor(sub, name, assetOf(sub)); if (p && Number.isFinite(p[0])) marks.push({ x: p[0], y: p[1], name: `${sub.id}.${name}`, rank: sub.rank || 1 }); } catch { /* no landmark */ } }
    const c = marks.find((m) => m.name === `${sub.id}.centroid`); if (c) axes.push({ x: c.x, y: c.y, deg: an.axisDeg ?? 90 }); }
  const nearMark = (x, y, tol) => marks.find((m) => Math.hypot(m.x - x, m.y - y) <= tol);
  const nearAxis = (x, y, tol) => axes.some((a) => { const r = a.deg * Math.PI / 180; const dx = Math.cos(r), dy = -Math.sin(r); return Math.abs((x - a.x) * dy - (y - a.y) * dx) <= tol; });
  // centres
  const centred = [];
  for (const e of els) {
    let r = null, closed = false;
    if (e.kind === 'container' && e.shape === 'circle' && e.r !== undefined) { r = e.r; closed = true; }
    else if (e.kind === 'rings') { r = Math.max(...(e.radii || [0])); closed = true; }
    else if (e.kind === 'orbit') { r = Math.max(e.rx || 0, e.ry || 0); closed = true; }
    else if (e.kind === 'field' && e.r !== undefined) { r = e.r; closed = true; }
    else if (e.kind === 'arc' && e.r !== undefined) { r = e.r; closed = Math.abs((e.end ?? 180) - (e.start ?? 0)) >= 360; }
    else if (e.kind === 'ticks' && e.r !== undefined) r = e.r + (e.len || 0);
    else if (e.kind === 'radial') r = e.outer || 0;
    else if (e.kind === 'system' && e.rx !== undefined) r = Math.max(e.rx, e.ry || e.rx);
    if (r !== null && Number.isFinite(e.cx) && Number.isFinite(e.cy)) centred.push({ id: e.id || e.kind, kind: e.kind, x: e.cx, y: e.cy, r, closed });
  }
  const clusters = [];
  for (const c of centred) { const k = clusters.find((cl) => Math.hypot(cl.x - c.x, cl.y - c.y) <= 0.02 * S); if (k) k.members.push(c.id); else clusters.push({ x: c.x, y: c.y, members: [c.id] }); }
  for (const cl of clusters) { const m = nearMark(cl.x, cl.y, 0.03 * S); cl.on = m ? m.name : nearAxis(cl.x, cl.y, 0.03 * S) ? 'axis' : null; }
  for (const cl of clusters) if (!cl.on && subjects.length) warn.push(`SKL-18 弧心 (${Math.round(cl.x)}, ${Math.round(cl.y)}) [${cl.members.join(', ')}] 不在任何主体的标志点或轴线上：一张一个心，第二个心只属于第二个主体`);
  for (let i = 0; i < centred.length; i++) for (let j = i + 1; j < centred.length; j++) { const a = centred[i], b = centred[j]; if (!a.closed || !b.closed) continue; const d = Math.hypot(a.x - b.x, a.y - b.y), rm = Math.max(a.r, b.r);
    if (d > 0.02 * S && d <= 0.35 * rm && Math.abs(a.r - b.r) <= 0.25 * rm) warn.push(`SKL-18 ${a.id} 与 ${b.id} 近似同心（心差 ${Math.round(d)}px，半径 ${Math.round(a.r)} / ${Math.round(b.r)}）：要么同心，要么明显不同；近似比无关更糟`); }
  // angles (degrees, rising to the right; perpendiculars are kin, so families live mod 90)
  const items = [];
  const segs = []; // straight geometry for the face test: [id, x1, y1, x2, y2]
  for (const e of els) {
    if (e.kind === 'lines') { items.push({ id: e.id || 'lines', a: e.angle ?? 27, n: (e.count || 1) + (e.perp || 0), straight: true, through: e.through }); for (const l of lineFamily(e, W, H)) segs.push([e.id || 'lines', ...l]); }
    else if ((e.kind === 'line' || e.kind === 'rule') && [e.x1, e.y1, e.x2, e.y2].every(Number.isFinite)) { const L = Math.hypot(e.x2 - e.x1, e.y2 - e.y1); if (L >= 0.2 * S) { items.push({ id: e.id || e.kind, a: Math.atan2(-(e.y2 - e.y1), e.x2 - e.x1) * 180 / Math.PI, n: 1, straight: true, seg: [e.x1, e.y1, e.x2, e.y2], centre: e.cx !== undefined ? [e.cx, e.cy] : null }); segs.push([e.id || e.kind, e.x1, e.y1, e.x2, e.y2]); } }
    else if (e.kind === 'horizon') { items.push({ id: e.id || 'horizon', a: 0, n: 1, straight: true, grid: true }); segs.push([e.id || 'horizon', 0, e.y, W, e.y]); }
    else if (e.kind === 'grid') items.push({ id: e.id || 'grid', a: 0, n: 2, straight: true, grid: true });
    else if ((e.kind === 'orbit' || (e.kind === 'system' && e.rx !== undefined)) && Math.abs((e.rx || 0) - (e.ry ?? e.rx ?? 0)) > 0.1 * Math.max(e.rx || 0, e.ry || 0)) items.push({ id: e.id || e.kind, a: -(e.tilt || 0), n: 1, straight: false, what: '椭圆倾角' });
    else if ((e.kind === 'sweep' || e.kind === 'ribbon') && Array.isArray(e.path) && e.path.length > 1) { const p0 = e.path[0], p1 = e.path[e.path.length - 1]; items.push({ id: e.id || e.kind, a: Math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0]) * 180 / Math.PI, n: 1, straight: false, what: '手势方向' }); }
  }
  const families = [];
  for (const it of items.filter((x) => x.straight)) { const f = families.find((fm) => angDiff(fm.a, it.a) <= 3); if (f) { f.members.push(it.id); f.n += it.n; } else families.push({ a: ang90(it.a), members: [it.id], n: it.n, grid: angDiff(it.a, 0) <= 3 }); }
  const diagonals = families.filter((f) => !f.grid).sort((p, q) => q.n - p.n);
  const declared = spec.axis ?? spec.principles?.alignment?.angle; const axis = declared ?? (diagonals[0] ? diagonals[0].a : null);
  const mirrorPair = diagonals.length === 2 && angDiff(diagonals[0].a, 90 - diagonals[1].a) <= 3; // a and its reflection in the vertical
  if (mirrorPair) { diagonals[0].mirror = diagonals[1].mirror = true; }
  if (diagonals.length > 1 && !mirrorPair) warn.push(`SKL-18 ${diagonals.length} 个斜线家族（${diagonals.map((f) => `${Math.round(f.a)}°: ${f.members.join('/')}`).join('；')}）：一张只有一条轴，斜线要么平行要么垂直于它`);
  const fname = (f) => `${f.grid ? '网格' : `线族 ${Math.round(f.a)}°`}（${f.members.join('/')}）`;
  for (let i = 0; i < families.length; i++) for (let j = i + 1; j < families.length; j++) { const d = angDiff(families[i].a, families[j].a); if (d > 3 && d <= 12) warn.push(`SKL-18 ${fname(families[i])}与${fname(families[j])}只差 ${Math.round(d)}°：近似平行比无关更糟，要么同族要么明显不同`); }
  if (declared !== undefined && declared !== null) for (const f of diagonals) { const d = angDiff(f.a, declared); if (d > 3 && d <= 12) warn.push(`SKL-18 线族 ${Math.round(f.a)}° 与声明的轴 ${declared}° 只差 ${Math.round(d)}°`); }
  for (const it of items.filter((x) => !x.straight)) { const near = [{ a: 0, label: '网格' }, ...families.filter((f) => !f.grid).map((f) => ({ a: f.a, label: `线族 ${Math.round(f.a)}°` })), ...(axis !== null && !families.some((f) => angDiff(f.a, axis) <= 3) ? [{ a: axis, label: `轴 ${Math.round(axis)}°` }] : [])];
    if (near.length) { const best = near.reduce((p, q) => (angDiff(it.a, q.a) < angDiff(it.a, p.a) ? q : p)); const d = angDiff(it.a, best.a); if (d > 12) warn.push(`SKL-18 ${it.what} ${it.id}（${Math.round(it.a)}°）离最近的${best.label}差 ${Math.round(d)}°：椭圆倾角和手势沿轴或沿网格走`); } }
  for (const f of diagonals) if (f.n === 1) { const it = items.find((x) => x.id === f.members[0]); const seg = it.seg || (it.through ? null : null);
    let kin = false; if (it.centre) kin = true; else if (it.through) kin = !!nearMark(it.through[0], it.through[1], 0.03 * S) || clusters.some((cl) => Math.hypot(cl.x - it.through[0], cl.y - it.through[1]) <= 0.03 * S);
    else if (seg) kin = marks.some((m) => segDist(m.x, m.y, ...seg) <= 0.03 * S) || clusters.some((cl) => segDist(cl.x, cl.y, ...seg) <= 0.03 * S);
    if (!kin) warn.push(`SKL-18 孤线 ${it.id}（${Math.round(it.a)}°）：没有平行线和垂线，也不过任何弧心或标志点`); }
  // the face: construction lines, gestures and plane type stay off it
  const eyes = marks.filter((m) => m.rank === 1 && /eyes|face|head/.test(m.name));
  if (eyes.length) { const win = spec.elements.find((e) => e.kind === 'container' && e.shape === 'circle' && e.hidden && eyes.some((m) => Math.hypot(m.x - e.cx, m.y - e.cy) <= 0.05 * S)); const fr = win ? win.r : 0.09 * S;
    for (const m of eyes) { const hit = new Set(); for (const [id, x1, y1, x2, y2] of segs) if (segDist(m.x, m.y, x1, y1, x2, y2) <= fr && !hit.has(id)) { hit.add(id); warn.push(`SKL-3 ${id} 穿过面部（${m.name}）：构图线不过脸`); }
      for (const e of els) if ((e.kind === 'sweep' || e.kind === 'ribbon') && Array.isArray(e.path) && polyDist(m.x, m.y, e.path) <= fr) warn.push(`SKL-18 手势 ${e.id || e.kind} 穿过面部（${m.name}）`);
      for (const e of els) if (e.kind === 'type' && e.role === 'plane' && e.box) { const b = e.box; const cx = Math.max(b.x, Math.min(m.x, b.x + b.w)), cy = Math.max(b.y, Math.min(m.y, b.y + b.h)); if (Math.hypot(cx - m.x, cy - m.y) <= fr) warn.push(`TYP-1 字面 ${e.id || e.text} 压在面部上：标题被脸切是关系，脸垫在标题上是冲突`); } } }
  // gestures: free curves. One per plate; fragments ride the same path or the flow.
  const curves = els.filter((e) => (['sweep', 'ribbon', 'trail', 'glyphs'].includes(e.kind) || (e.kind === 'system' && e.rx === undefined)) && Array.isArray(e.path) && e.path.length > 1).map((e) => ({ id: e.id || e.kind, path: e.path, flow: !!e.along }));
  const groups = [];
  for (const c of curves) { const g = groups.find((gr) => (gr.flow && c.flow) || gr.paths.some((p) => hausdorff(p, c.path) <= 0.05 * S)); if (g) { g.ids.push(c.id); g.paths.push(c.path); g.flow = g.flow || c.flow; } else groups.push({ ids: [c.id], paths: [c.path], flow: c.flow }); }
  for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) { const d = Math.min(...groups[i].paths.flatMap((p) => groups[j].paths.map((q) => hausdorff(p, q)))); if (d <= 0.2 * S) warn.push(`SKL-18 ${groups[i].ids.join('/')} 与 ${groups[j].ids.join('/')} 几乎同路（最大偏差 ${Math.round(d)}px）：让碎片沿同一条路（along）或拉开`); }
  if (groups.length > 1) warn.push(`SKL-18 ${groups.length} 条自由曲线（${groups.map((g) => g.ids.join('/')).join('；')}）：一张只有一条手势，其余弧线共心、碎片沿手势或动线走`);
  return { centres: clusters.map((cl) => ({ x: Math.round(cl.x), y: Math.round(cl.y), on: cl.on, members: cl.members })), axis: axis === null ? null : Math.round(axis), declared: declared ?? null, families: families.map((f) => ({ angle: Math.round(f.a), grid: f.grid, mirror: !!f.mirror, members: f.members, lines: f.n })), gestures: groups.map((g) => g.ids) };
}

// Convenience: everything the Studio and the CLI need from a spec in one call.
export function renderAll(spec, opts = {}) {
  const norm = normalizeSpec(spec, opts);
  return { spec: norm, svg: renderPlate(norm, opts), wire: wireOverlay(norm, opts), structure: checkStructure(norm, opts) };
}
