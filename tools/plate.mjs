#!/usr/bin/env node
// plate.mjs: final-render CLI over kcl-render.mjs.
//   render  spec.json -o out.svg [--layers plane,subject] [--wire] [--inline]   final SVG (assets referenced relative to the spec, or inlined as data URIs)
//   migrate spec.json [-o out.json]                                              spec-v1 → spec-v2 (defaults filled, weights explicit)
//   check   spec.json [--json]                                                   structural checks: weight classes, solid plane, signal carrier, rendered-character rules
//   shot    spec.json -o out.png [--scale 2] [--layers ...] [--wire] [--url http://127.0.0.1:4777]   screenshot through Playwright (starts a loopback server if no --url)
//   measure spec.json [--json] [--url ...]                                       pixel diagnostics: coverage, 3×3 grid, stroke weights, signal blob, interweave
//   anatomy asset.png [--json]                                                   bbox, centroid, principal axis, top point, band masses of a cutout (alpha or luma)
//   Assets resolve relative to the spec's folder, or to --root <dir> when given (render / shot / measure).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderAll, migrateSpec, normalizeSpec, renderPlate, wireOverlay, checkStructure } from './kcl-render.mjs';
import { decodePNG, imageSize } from './png.mjs';
import { measure, judge } from './measure.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
function parseArgs(argv) { const o = { _: [] }; for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a === '-o') { o.o = argv[++i]; continue; } if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1]; if (v === undefined || v.startsWith('-')) o[k] = true; else { o[k] = v; i++; } } else o._.push(a); } return o; }
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf' };

export function loadSpec(p) { const spec = JSON.parse(fs.readFileSync(p, 'utf8')); if (spec.kcl !== 'spec-v1' && spec.kcl !== 'spec-v2') throw new Error('not a KCL spec (missing "kcl": "spec-v2")'); return spec; }
export function assetSizes(spec, root) { const out = {}; const srcs = new Set(); for (const el of spec.elements || []) { for (const lv of el.levels || []) if (lv && lv.src) srcs.add(lv.src); if (el.src) srcs.add(el.src); } for (const s of srcs) { const p = path.resolve(root, s); if (fs.existsSync(p)) { try { const sz = imageSize(fs.readFileSync(p)); if (sz) out[s] = sz; } catch {} } } return out; }
function dataUri(root, src) { const p = path.resolve(root, src); if (!fs.existsSync(p)) return src; const ext = path.extname(p).toLowerCase(); return `data:${MIME[ext] || 'application/octet-stream'};base64,${fs.readFileSync(p).toString('base64')}`; }

export function renderFile(specPath, { inline = false, layers, wire = false, id = 'p', root: rootOpt } = {}) {
  const spec = loadSpec(specPath); const root = rootOpt ? path.resolve(rootOpt) : path.dirname(path.resolve(specPath)); const assets = assetSizes(spec, root);
  const resolve = inline ? (s) => dataUri(root, s) : (s) => s;
  const norm = normalizeSpec(spec, { assets });
  const extra = wire ? wireOverlay(norm, { assets, show: { grid: wire === 'grid' } }) : '';
  return { svg: renderPlate(norm, { assets, resolve, id, layers: layers ? String(layers).split(',') : null, extra }), spec: norm, structure: checkStructure(norm) };
}

async function withServer(specPath, opts, fn) {
  if (opts.base || opts.url) return fn(opts.base || opts.url);
  const { startStudio } = await import('./studio/server.mjs'); const st = await startStudio({ specPath, port: 0, root: opts.root });
  try { return await fn(st.url); } finally { st.server.close(); }
}
export async function shotSpec(specPath, opts = {}) {
  const { shotUrl, closeBrowser } = await import('./browser.mjs'); const spec = loadSpec(specPath); const { w, h } = spec.canvas;
  const q = new URLSearchParams(); if (opts.layers) q.set('layers', opts.layers); if (opts.wire) q.set('wire', '1');
  const png = await withServer(specPath, opts, (base) => shotUrl(`${base}/plate?${q}`, { w, h, scale: opts.scale || 1 }));
  if (!opts.keepBrowser) await closeBrowser();
  if (opts.out) fs.writeFileSync(opts.out, png); return png;
}
export async function measureSpec(specPath, opts = {}) {
  const { shotUrl, closeBrowser } = await import('./browser.mjs'); const spec = loadSpec(specPath); const { w, h } = spec.canvas; const norm = normalizeSpec(spec);
  const pal = { bg: (spec.color?.ground === 'ink' ? spec.color.ink : spec.color?.paper) || '#f3efe6', fg: (spec.color?.ground === 'ink' ? spec.color.paper : spec.color?.ink) || '#111', signal: spec.color?.signal || '#ff3b1f', signal2: spec.color?.signal2 };
  const shots = {};
  await withServer(specPath, opts, async (base) => {
    for (const [key, layers] of [['full', null], ['subject', 'ground,subject'], ['apparatus', 'ground,plane,system,fragment,signal'], ['signal', 'ground,signal']]) {
      const q = new URLSearchParams(); if (layers) q.set('layers', layers); const png = await shotUrl(`${base}/plate?${q}`, { w, h, scale: 1 }); shots[key] = decodePNG(png);
    }
  });
  await closeBrowser();
  const m = measure(shots, norm, pal); const structure = checkStructure(norm); m.structure = structure; m.warnings = judge(m, structure); return m;
}

export function anatomy(buf, { mode = 'auto', thresh = 0.5 } = {}) {
  const img = decodePNG(buf); const { w, h, data } = img; let useAlpha = mode === 'alpha'; if (mode === 'auto') { let opaque = 0; for (let i = 3; i < data.length; i += 4) if (data[i] < 250) opaque++; useAlpha = opaque > w * h * 0.02; }
  const mask = new Uint8Array(w * h); let n = 0, sx = 0, sy = 0; let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = (y * w + x) * 4; const on = useAlpha ? data[p + 3] > 40 : (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255 < thresh && data[p + 3] > 40; if (!on) continue; mask[y * w + x] = 1; n++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (!n) return { w, h, empty: true };
  const cx = sx / n, cy = sy / n; let sxx = 0, syy = 0, sxy = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { const dx = x - cx, dy = y - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy); // principal axis angle (radians, from +x, y down)
  let top = null; for (let y = y0; y <= y1 && !top; y++) { let acc = 0, cnt = 0; for (let x = x0; x <= x1; x++) if (mask[y * w + x]) { acc += x; cnt++; } if (cnt) top = [acc / cnt, y]; }
  const bands = []; const bh = (y1 - y0 + 1) / 5; for (let b = 0; b < 5; b++) { let c = 0; const ya = Math.floor(y0 + b * bh), yb = Math.floor(y0 + (b + 1) * bh); for (let y = ya; y < yb; y++) for (let x = x0; x <= x1; x++) if (mask[y * w + x]) c++; bands.push(+(c / n).toFixed(3)); }
  const N = ([x, y]) => [+(x / w).toFixed(4), +(y / h).toFixed(4)];
  return { w, h, mode: useAlpha ? 'alpha' : 'luma', bbox: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }, bboxN: { x: +(x0 / w).toFixed(4), y: +(y0 / h).toFixed(4), w: +((x1 - x0 + 1) / w).toFixed(4), h: +((y1 - y0 + 1) / h).toFixed(4) }, centroid: N([cx, cy]), top: N(top), axisDeg: +(angle * 180 / Math.PI).toFixed(1), bands, fill: +(n / (w * h)).toFixed(3) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2)); const [cmd, file] = args._;
  if (!cmd || !file) { console.error(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n').replace(/^\/\/ ?/gm, '')); process.exit(2); }
  if (cmd === 'render') { const r = renderFile(file, { inline: !!args.inline, layers: args.layers, wire: args.wire === true ? true : args.wire, root: args.root }); if (args.o) fs.writeFileSync(args.o, r.svg); else process.stdout.write(r.svg); if (r.structure.warnings.length) console.error(r.structure.warnings.map((w) => `! ${w}`).join('\n')); return; }
  if (cmd === 'migrate') { const out = migrateSpec(loadSpec(file)); const text = `${JSON.stringify(out, null, 2)}\n`; if (args.o) fs.writeFileSync(args.o, text); else process.stdout.write(text); return; }
  if (cmd === 'check') { const r = checkStructure(loadSpec(file), { assets: assetSizes(loadSpec(file), path.dirname(path.resolve(file))) }); if (args.json) console.log(JSON.stringify(r, null, 2)); else { console.log(`weight classes: ${r.weightClasses.join(', ')}  solid plane: ${r.solidPlane}  signal carriers: ${r.signalCarriers.join(', ') || 'none'}`); if (r.kinship) { const k = r.kinship; console.log(`kinship: centres ${k.centres.length}${k.centres.length ? ` (${k.centres.map((c) => `${c.on || '自由'}: ${c.members.join('/')}`).join('; ')})` : ''}  axis ${k.axis === null ? '—' : `${k.axis}°`}${k.declared !== null ? ' (declared)' : ''}  families ${k.families.map((f) => `${f.grid ? '网格' : `${f.angle}°`}×${f.lines}`).join(', ') || 'none'}  gestures ${k.gestures.length}`); } for (const w of r.warnings) console.log(`! ${w}`); if (!r.warnings.length) console.log('structure ok'); } return; }
  if (cmd === 'shot') { const out = args.o || file.replace(/\.kcl-spec\.json$|\.json$/, '') + '.png'; await shotSpec(file, { out, scale: +(args.scale || 1), layers: args.layers, wire: !!args.wire, url: args.url, root: args.root }); console.log(out); return; }
  if (cmd === 'measure') { const m = await measureSpec(file, { url: args.url, root: args.root }); if (args.json) console.log(JSON.stringify(m, null, 2)); else { const c = m.coverage; console.log(`paper ${pc(c.paper)}  ink ${pc(c.ink)}  mid ${pc(c.mid)}  signal ${(c.signal * 100).toFixed(2)}%${c.material ? `  material ${pc(c.material)}` : ''}  midtone ${pc(m.midtone)}`); console.log(`3×3 ink: ${m.grid.map((g) => pc(g)).join(' ')}  densest ${pc(m.densest)}  emptiest ${pc(m.emptiest)}`); if (m.apparatus) console.log(`apparatus strokes: ${Object.entries(m.apparatus.strokes).map(([k, v]) => `${k} ${pc(v)}`).join('  ')}  → ${m.apparatus.classesPresent.join(', ')}`); if (m.interweave) console.log(`interweave: apparatus over subject ${pc(m.interweave.apparatusOverSubject)} of subject pixels`); console.log(`signal blob ${m.signalBlobPx}px`); for (const w of m.warnings) console.log(`! ${w}`); if (!m.warnings.length) console.log('measure ok'); } return; }
  if (cmd === 'anatomy') { const a = anatomy(fs.readFileSync(file), { mode: args.mode || 'auto', thresh: +(args.thresh || 0.5) }); console.log(JSON.stringify(a, null, args.json ? 2 : 0)); return; }
  console.error(`unknown command ${cmd}`); process.exit(2);
}
const pc = (v) => `${Math.round(v * 100)}%`;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
