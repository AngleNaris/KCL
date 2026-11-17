#!/usr/bin/env node
// KCL Studio server: serves the live canvas, the spec (read/write), assets and reference images on loopback.
// Usage: node server.mjs <spec.json> [--port 4777] [--host 127.0.0.1] [--refs <dir>] [--root <dir>] [--open]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageSize } from '../png.mjs';
import { migrateSpec } from '../kcl-render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)); const toolsDir = path.resolve(here, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };

export function parseArgs(argv) { const o = { _: [] }; for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) o[k] = true; else { o[k] = v; i++; } } else o._.push(a); } return o; }

function safeJoin(root, rel) { const p = path.resolve(root, decodeURIComponent(rel).replace(/^\/+/, '')); if (p !== root && !p.startsWith(root + path.sep)) return null; return p; }
function send(res, code, body, type = 'application/json; charset=utf-8', extra = {}) { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store', 'access-control-allow-origin': '*', ...extra }); res.end(body); }
function sendFile(res, p) { if (!p || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return send(res, 404, 'not found', 'text/plain'); const ext = path.extname(p).toLowerCase(); fs.createReadStream(p).on('error', () => send(res, 500, 'read error', 'text/plain')).once('open', () => res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': 'no-store' })).pipe(res); }
function readBody(req) { return new Promise((resolve, reject) => { const c = []; req.on('data', (d) => { c.push(d); if (c.reduce((a, b) => a + b.length, 0) > 20e6) reject(new Error('too large')); }); req.on('end', () => resolve(Buffer.concat(c))); req.on('error', reject); }); }

export function createStudio({ specPath, root, refsDir, history = 30 }) {
  specPath = path.resolve(specPath); root = path.resolve(root || path.dirname(specPath)); refsDir = refsDir ? path.resolve(refsDir) : null;
  const histDir = path.join(path.dirname(specPath), '.kcl-history');
  const readSpec = () => { const raw = fs.readFileSync(specPath, 'utf8'); const spec = JSON.parse(raw); return spec; };
  const assetsOf = (spec) => { const out = {}; const srcs = new Set(); for (const el of spec.elements || []) { for (const lv of el.levels || []) if (lv && typeof lv === 'object' && lv.src) srcs.add(lv.src); if (el.src) srcs.add(el.src); } for (const ft of spec.fonts || []) if (ft.src) srcs.add(ft.src); for (const src of srcs) { const p = safeJoin(root, src); let info = { url: `/file/${src.replace(/^\/+/, '')}`, exists: false }; if (p && fs.existsSync(p)) { const st = fs.statSync(p); info.exists = true; info.mtimeMs = st.mtimeMs; try { const buf = fs.readFileSync(p); const sz = imageSize(buf); if (sz) { info.w = sz.w; info.h = sz.h; info.type = sz.type; } } catch {} } out[src] = info; } return out; };
  const state = () => { let specMtime = 0; try { specMtime = fs.statSync(specPath).mtimeMs; } catch {} let spec = null; try { spec = readSpec(); } catch {} const assets = spec ? assetsOf(spec) : {}; const sig = `${specMtime}|${Object.values(assets).map((a) => a.mtimeMs || 0).join(',')}`; return { specMtime, assets, sig }; };
  const writeSpec = (spec, who = 'studio') => { if (spec.kcl !== 'spec-v1' && spec.kcl !== 'spec-v2') throw new Error('spec must carry "kcl": "spec-v2"'); try { fs.mkdirSync(histDir, { recursive: true }); if (fs.existsSync(specPath)) { const stamp = new Date().toISOString().replace(/[:.]/g, '-'); fs.copyFileSync(specPath, path.join(histDir, `${path.basename(specPath, '.json')}.${stamp}.${who}.json`)); const files = fs.readdirSync(histDir).filter((f) => f.startsWith(path.basename(specPath, '.json'))).sort(); while (files.length > history) fs.unlinkSync(path.join(histDir, files.shift())); } } catch {} const tmp = `${specPath}.tmp`; fs.writeFileSync(tmp, `${JSON.stringify(spec, null, 2)}\n`); fs.renameSync(tmp, specPath); return fs.statSync(specPath).mtimeMs; };
  const listRefs = () => { if (!refsDir || !fs.existsSync(refsDir)) return []; return fs.readdirSync(refsDir).filter((f) => /\.(png|jpe?g|webp|gif|svg)$/i.test(f)).sort().map((f) => ({ name: f, url: `/ref/${encodeURIComponent(f)}` })); };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x'); const p = url.pathname;
    try {
      if (req.method === 'OPTIONS') return send(res, 204, '', 'text/plain', { 'access-control-allow-methods': 'GET,PUT,POST,OPTIONS', 'access-control-allow-headers': 'content-type' });
      if (p === '/' || p === '/index.html') return sendFile(res, path.join(here, 'index.html'));
      if (p === '/plate') return sendFile(res, path.join(here, 'plate.html'));
      if (p.startsWith('/studio/')) return sendFile(res, safeJoin(here, p.slice(8)));
      if (p.startsWith('/lib/')) return sendFile(res, safeJoin(toolsDir, p.slice(5)));
      if (p.startsWith('/file/')) return sendFile(res, safeJoin(root, p.slice(6)));
      if (p.startsWith('/ref/')) return refsDir ? sendFile(res, safeJoin(refsDir, p.slice(5))) : send(res, 404, 'no refs dir', 'text/plain');
      if (p === '/api/state') return send(res, 200, JSON.stringify(state()));
      if (p === '/api/refs') return send(res, 200, JSON.stringify(listRefs()));
      if (p === '/api/spec' && req.method === 'GET') { const st = state(); const spec = readSpec(); return send(res, 200, JSON.stringify({ path: specPath, root, specMtime: st.specMtime, assets: st.assets, spec, migrated: spec.kcl === 'spec-v1' ? migrateSpec(spec) : null })); }
      if (p === '/api/spec' && (req.method === 'PUT' || req.method === 'POST')) { const body = await readBody(req); const spec = JSON.parse(body.toString('utf8')); const mtime = writeSpec(spec, url.searchParams.get('who') || 'studio'); return send(res, 200, JSON.stringify({ ok: true, specMtime: mtime })); }
      if (p === '/api/history') { const files = fs.existsSync(histDir) ? fs.readdirSync(histDir).filter((f) => f.startsWith(path.basename(specPath, '.json'))).sort().reverse() : []; return send(res, 200, JSON.stringify(files)); }
      if (p === '/api/restore' && req.method === 'POST') { const body = JSON.parse((await readBody(req)).toString('utf8')); const f = safeJoin(histDir, body.file || ''); if (!f || !fs.existsSync(f)) return send(res, 404, '{"error":"no such history"}'); const spec = JSON.parse(fs.readFileSync(f, 'utf8')); const mtime = writeSpec(spec, 'restore'); return send(res, 200, JSON.stringify({ ok: true, specMtime: mtime })); }
      if (p === '/api/measure' && req.method === 'POST') { const { measureSpec } = await import('../plate.mjs'); const base = `http://${req.headers.host}`; const result = await measureSpec(specPath, { base, root }); return send(res, 200, JSON.stringify(result)); }
      if (p === '/api/shot' && req.method === 'POST') { const { shotSpec } = await import('../plate.mjs'); const base = `http://${req.headers.host}`; const q = Object.fromEntries(url.searchParams); const out = q.out ? safeJoin(root, q.out) : path.join(path.dirname(specPath), `${path.basename(specPath, '.kcl-spec.json').replace(/\.json$/, '')}.shot.png`); await shotSpec(specPath, { base, out, layers: q.layers, wire: q.wire === '1', scale: +(q.scale || 1) }); return send(res, 200, JSON.stringify({ ok: true, out })); }
      return send(res, 404, 'not found', 'text/plain');
    } catch (e) { return send(res, 500, JSON.stringify({ error: String(e.message || e) })); }
  });
  return { server, specPath, root, refsDir, state, readSpec, writeSpec };
}

export function startStudio(opts) { return new Promise((resolve, reject) => { const st = createStudio(opts); st.server.once('error', reject); st.server.listen(opts.port ?? 0, opts.host || '127.0.0.1', () => { const a = st.server.address(); st.url = `http://${a.address}:${a.port}`; resolve(st); }); }); }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2)); const specPath = args._[0];
  if (!specPath || !fs.existsSync(specPath)) { console.error('usage: node server.mjs <spec.json> [--port 4777] [--host 127.0.0.1] [--refs <dir>] [--root <dir>]'); process.exit(2); }
  startStudio({ specPath, port: +(args.port || 4777), host: args.host, refsDir: args.refs, root: args.root }).then((st) => {
    console.log(`KCL Studio  ${st.url}\n  spec  ${st.specPath}\n  root  ${st.root}${st.refsDir ? `\n  refs  ${st.refsDir}` : ''}\n  plate ${st.url}/plate   (plain render for screenshots)\nCtrl-C to stop.`);
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
