import { normalizeSpec, renderPlate, wireOverlay, checkStructure, LAYER_ORDER, elementBox, migrateSpec } from '/lib/kcl-render.mjs';

const $ = (s) => document.querySelector(s);
const S = { spec: null, raw: null, assets: {}, sig: null, paused: false, sel: -1, show: { skeleton: true, flow: true, grid: false, heat: false }, layers: new Set(LAYER_ORDER), zoom: 'fit', measure: null, dragging: false, specPath: '' };
const LAYER_LABEL = { ground: '地', plane: '面', typePlane: '字面', subject: '主体', system: '装置', fragment: '碎片', signal: '信号', type: '文字', overlay: '肌理', quiet: '静区' };

function assetMap() { const m = {}; for (const [k, v] of Object.entries(S.assets)) if (v.w) m[k] = { w: v.w, h: v.h }; return m; }
const resolve = (s) => (S.assets[s] ? `${S.assets[s].url}?v=${S.assets[s].mtimeMs || 0}` : s);

// ---------- load / poll ----------
async function load() {
  const r = await fetch('/api/spec').then((x) => x.json());
  S.raw = r.spec; S.spec = r.migrated || r.spec; S.assets = r.assets; S.specPath = r.path; $('#file').textContent = r.path; $('#file').title = r.path;
  if (r.migrated) status('spec-v1 已按 v2 默认值显示；保存时将写回 v2');
  render(); renderList();
}
async function poll() {
  if (S.paused || S.dragging) return;
  try { const st = await fetch('/api/state').then((x) => x.json()); if (S.sig !== null && st.sig !== S.sig) { await load(); status(`文件已更新 ${time()}`); } S.sig = st.sig; $('#live').textContent = `live ${time()}`; } catch { $('#live').textContent = 'offline'; }
}
const time = () => new Date().toTimeString().slice(0, 8);
function status(t) { $('#status').textContent = t; }

// ---------- render ----------
function render() {
  const spec = S.spec; if (!spec) return; const assets = assetMap(); const norm = normalizeSpec(spec, { assets }); S.norm = norm;
  const { w: W, h: H } = spec.canvas; const wrap = $('#plateWrap');
  const svg = renderPlate(norm, { assets, resolve, layers: [...S.layers], id: 'st' });
  const wire = `<svg id="wire" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${(S.show.skeleton || S.show.flow || S.show.grid) ? wireOverlay(norm, { assets, show: { skeleton: S.show.skeleton, flow: S.show.flow, grid: S.show.grid, boxes: S.show.skeleton } }) : ''}</svg>`;
  wrap.innerHTML = svg + wire + `<svg id="heat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${S.show.heat ? heatSvg(W, H) : ''}</svg><svg id="handles" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"></svg>`;
  wrap.style.width = `${W}px`; wrap.style.height = `${H}px`; applyZoom(); drawHandles(); bindCanvas();
  const st = checkStructure(norm); S.structure = st; if (!S.measure) report();
}
function heatSvg(W, H) { if (!S.measure) return `<text x="20" y="40">先点「测量」</text>`; const g = S.measure.grid; let out = ''; for (let i = 0; i < 9; i++) { const gx = i % 3, gy = Math.floor(i / 3); const v = g[i]; out += `<rect x="${gx * W / 3}" y="${gy * H / 3}" width="${W / 3}" height="${H / 3}" fill="${v < 0.04 ? '#5b8def' : '#ff7a1a'}" opacity="${v < 0.04 ? 0.18 : Math.min(0.4, v * 0.7)}"/><text x="${gx * W / 3 + 12}" y="${gy * H / 3 + 26}">${Math.round(v * 100)}%</text>`; } return out; }
function applyZoom() { const wrap = $('#plateWrap'); const { w: W, h: H } = S.spec.canvas; let z = S.zoom; if (z === 'fit') { const st = $('#stage'); const refOpen = $('#refWrap').classList.contains('open'); z = Math.min((st.clientWidth - 56 - (refOpen ? st.clientWidth * 0.38 : 0)) / W, (st.clientHeight - 56) / H, 1.5); } z = +z; S.z = z; wrap.style.transform = `scale(${z})`; wrap.style.marginRight = `${W * z - W}px`; wrap.style.marginBottom = `${H * z - H}px`; }

// ---------- element list / inspector ----------
function renderList() {
  const box = $('#elements'); box.innerHTML = '';
  S.spec.elements.forEach((raw, i) => { const el = (S.norm && S.norm.elements[i]) || raw; const row = document.createElement('div'); row.className = `row${i === S.sel ? ' selected' : ''}`; row.dataset.i = i; row.innerHTML = `<input type="checkbox" ${el.hidden ? '' : 'checked'} title="隐藏（仅 Studio）"><span><span class="k">${el.kind}</span> ${el.id || ''}</span><span class="w">${el.kind === 'subject' ? (el.render || '') : [el.weight, el.fill === 'solid' ? '' : el.fill].filter(Boolean).join('/')}</span>`; row.querySelector('input').addEventListener('change', (e) => { raw.hidden = !e.target.checked; render(); }); row.addEventListener('click', (e) => { if (e.target.tagName === 'INPUT') return; select(i); }); box.appendChild(row); });
}
function select(i) { S.sel = i; renderList(); drawHandles(); inspector(); }
const NUM = (v) => (v === '' || v === undefined ? undefined : +v);
function inspector() {
  const box = $('#inspector'); const el = S.spec.elements[S.sel]; if (!el) { box.innerHTML = '<span style="color:var(--dim)">未选择</span>'; return; }
  const ne = S.norm.elements[S.sel] || el; const b = elementBox(ne, S.spec.canvas.w, S.spec.canvas.h); const isSubject = el.kind === 'subject';
  const sel = (name, opts, cur) => `<label>${name}<select data-f="${name}">${opts.map((o) => `<option ${o === cur ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  box.innerHTML = `<div class="grid">
    <label class="wide">id<input type="text" data-f="id" value="${el.id || ''}"></label>
    <label>x<input type="number" data-g="x" value="${Math.round(b.x)}"></label><label>y<input type="number" data-g="y" value="${Math.round(b.y)}"></label>
    <label>w<input type="number" data-g="w" value="${Math.round(b.w)}"></label><label>h<input type="number" data-g="h" value="${Math.round(b.h)}"></label>
    ${isSubject ? sel('render', ['reduced', 'rendered', 'placeholder'], el.render || 'reduced') + sel('fit', ['contain', 'cover', 'stretch'], el.fit || 'contain') : sel('weight', ['hairline', 'line', 'rule', 'band', 'bar'], ne.weight) + sel('fill', ['solid', 'outline', 'ghost'], ne.fill) + sel('ink', ['fg', 'signal', 'signal2', 'bg'], ne.ink || 'fg')}
    <label class="wide">JSON<textarea data-f="json">${esc(JSON.stringify(el, null, 1))}</textarea></label>
    <div class="wide" style="display:flex;gap:6px"><button id="bApply">应用 JSON</button><button id="bDup">复制</button><button id="bDel">删除</button></div>
  </div>`;
  box.querySelectorAll('[data-f]:not(textarea)').forEach((inp) => inp.addEventListener('change', () => { el[inp.dataset.f] = inp.value; commit(`${el.id || el.kind}.${inp.dataset.f}`); }));
  box.querySelectorAll('[data-g]').forEach((inp) => inp.addEventListener('change', () => { materialize(S.sel); const nb = { ...elementBox(el, S.spec.canvas.w, S.spec.canvas.h) }; nb[inp.dataset.g] = +inp.value; setBox(el, nb); commit(`${el.id || el.kind} geometry`); }));
  $('#bApply').addEventListener('click', () => { try { const next = JSON.parse(box.querySelector('textarea').value); S.spec.elements[S.sel] = next; commit(`${next.id || next.kind} json`); } catch (e) { status(`JSON 错误：${e.message}`); } });
  $('#bDup').addEventListener('click', () => { const copy = structuredClone(el); copy.id = `${el.id || el.kind}-copy`; S.spec.elements.splice(S.sel + 1, 0, copy); S.sel++; commit('duplicate'); });
  $('#bDel').addEventListener('click', () => { S.spec.elements.splice(S.sel, 1); S.sel = -1; commit('delete'); });
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// Write a box back into whatever geometry the element kind uses.
function setBox(el, nb) {
  const k = el.kind;
  if (el.box) { el.box = { ...el.box, x: nb.x, y: nb.y, w: nb.w, h: nb.h }; }
  else if (k === 'container' && el.r !== undefined) { el.cx = nb.x + nb.w / 2; el.cy = nb.y + nb.h / 2; el.r = Math.max(nb.w, nb.h) / 2; }
  else if (k === 'rings') { const r0 = Math.max(...el.radii); const s = Math.max(nb.w, nb.h) / 2 / r0; el.cx = nb.x + nb.w / 2; el.cy = nb.y + nb.h / 2; el.radii = el.radii.map((r) => Math.round(r * s)); }
  else if (k === 'radial') { const s = Math.max(nb.w, nb.h) / 2 / el.outer; el.cx = nb.x + nb.w / 2; el.cy = nb.y + nb.h / 2; el.outer = Math.round(el.outer * s); el.inner = Math.round(el.inner * s); }
  else if (k === 'orbit') { el.cx = nb.x + nb.w / 2; el.cy = nb.y + nb.h / 2; el.rx = nb.w / 2; el.ry = nb.h / 2; }
  else if (k === 'mark') { el.x = nb.x + nb.w / 2; el.y = nb.y + nb.h / 2; el.size = Math.max(nb.w, nb.h); }
  else if (k === 'rule' || k === 'line') { const ob = elementBox(el); const sx = ob.w ? nb.w / ob.w : 1, sy = ob.h ? nb.h / ob.h : 1; const map = (x, y) => [nb.x + (x - ob.x) * sx, nb.y + (y - ob.y) * sy]; [el.x1, el.y1] = map(el.x1, el.y1); [el.x2, el.y2] = map(el.x2, el.y2); }
  else if (k === 'horizon') { el.y = nb.y + 1; }
  else if (k === 'lines') { el.through = [nb.x + nb.w / 2, nb.y + nb.h / 2]; }
  else if (el.path) { const ob = elementBox(el); const sx = ob.w ? nb.w / ob.w : 1, sy = ob.h ? nb.h / ob.h : 1; el.path = el.path.map(([x, y]) => [Math.round(nb.x + (x - ob.x) * sx), Math.round(nb.y + (y - ob.y) * sy)]); }
  else if (el.x !== undefined) { el.x = nb.x; el.y = nb.y; if (el.w !== undefined) { el.w = nb.w; el.h = nb.h; } }
  for (const key of ['x', 'y', 'w', 'h', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2']) if (typeof el[key] === 'number') el[key] = Math.round(el[key]);
  if (el.box) for (const key of ['x', 'y', 'w', 'h']) el.box[key] = Math.round(el.box[key]);
  if (el.anchor) delete el.anchor; // moved by hand → no longer anchored
}

// Copy resolved geometry (anchor / along) from the normalized element into the raw spec so it can be edited by hand.
function materialize(i) { const el = S.spec.elements[i]; const ne = S.norm.elements[i]; if (!el || !ne) return; if (el.anchor) { for (const key of ['cx', 'cy', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'through']) if (ne[key] !== undefined) el[key] = structuredClone(ne[key]); if (ne.box) el.box = { ...ne.box }; delete el.anchor; } if (el.along && ne.path) { el.path = structuredClone(ne.path); delete el.along; } }

// ---------- save ----------
let saveTimer = null;
function commit(what) {
  render(); renderList(); inspector();
  clearTimeout(saveTimer); saveTimer = setTimeout(async () => { try { const out = structuredClone(S.spec); delete out.__W; delete out.__H; for (const el of out.elements) delete el.hidden; const r = await fetch('/api/spec?who=studio', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(out) }).then((x) => x.json()); if (r.error) throw new Error(r.error); const st = await fetch('/api/state').then((x) => x.json()); S.sig = st.sig; status(`已保存 ${what} ${time()}`); } catch (e) { status(`保存失败：${e.message}`); } }, 150);
}

// ---------- canvas interaction ----------
function canvasPoint(ev) { const svg = $('#handles'); const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y]; }
function drawHandles() {
  const h = $('#handles'); if (!h) return; let out = ''; const el = S.norm.elements[S.sel];
  if (el) { const b = elementBox(el, S.spec.canvas.w, S.spec.canvas.h); out += `<rect class="box" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/><rect class="grip" data-grip="se" x="${b.x + b.w - 6 / S.z}" y="${b.y + b.h - 6 / S.z}" width="${12 / S.z}" height="${12 / S.z}"/>`; }
  const fl = S.spec.flow; if (fl && S.show.flow) { const pts = [['entry', fl.entry], ...(fl.path || []).map((p, i) => [`path:${i}`, p]), ['exit', fl.exit]].filter(([, p]) => p); for (const [key, p] of pts) out += `<circle class="fp" data-fp="${key}" cx="${p[0]}" cy="${p[1]}" r="${7 / S.z}"/>`; (fl.stations || []).forEach((s, i) => { out += `<circle class="fp station" data-fp="station:${i}" cx="${s.at[0]}" cy="${s.at[1]}" r="${9 / S.z}"/>`; }); }
  h.innerHTML = out;
}
function bindCanvas() {
  const plate = $('#plateWrap svg[data-kcl="plate"]'); const handles = $('#handles');
  plate.addEventListener('pointerdown', (ev) => { const g = ev.target.closest('[data-el]'); if (!g) { select(-1); return; } const i = +g.dataset.el; select(i); startDrag(ev, 'move', i); });
  handles.addEventListener('pointerdown', (ev) => { const t = ev.target; if (t.dataset.grip) startDrag(ev, 'resize', S.sel); else if (t.dataset.fp) startDrag(ev, 'flow', t.dataset.fp); });
}
function startDrag(ev, mode, target) {
  ev.preventDefault(); const start = canvasPoint(ev); if (typeof target === 'number') materialize(target); const el = typeof target === 'number' ? S.spec.elements[target] : null; const base = el ? structuredClone(elementBox(el, S.spec.canvas.w, S.spec.canvas.h)) : null; const fl = S.spec.flow; let fp0 = null;
  if (mode === 'flow') { fp0 = flowPoint(fl, target).slice(); }
  S.dragging = true; let moved = false;
  const onMove = (e) => { const p = canvasPoint(e); const dx = p[0] - start[0], dy = p[1] - start[1]; if (Math.abs(dx) + Math.abs(dy) < 1) return; moved = true;
    if (mode === 'move') setBox(el, { ...base, x: base.x + dx, y: base.y + dy }); else if (mode === 'resize') { const keep = e.shiftKey; let w = Math.max(4, base.w + dx), h = Math.max(4, base.h + dy); if (keep) { const s = Math.max(w / base.w, h / base.h); w = base.w * s; h = base.h * s; } setBox(el, { ...base, w, h }); } else if (mode === 'flow') { const q = flowPoint(fl, target); q[0] = Math.round(fp0[0] + dx); q[1] = Math.round(fp0[1] + dy); }
    renderLight(); };
  const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); S.dragging = false; if (moved) commit(mode === 'flow' ? `flow ${target}` : `${el.id || el.kind} ${mode}`); };
  window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
}
function flowPoint(fl, key) { if (key === 'entry') return fl.entry; if (key === 'exit') return fl.exit; if (key.startsWith('path:')) return fl.path[+key.slice(5)]; if (key.startsWith('station:')) return fl.stations[+key.slice(8)].at; }
let raf = null; function renderLight() { if (raf) return; raf = requestAnimationFrame(() => { raf = null; render(); }); }

// ---------- report ----------
function report() {
  const box = $('#report'); const st = S.structure || { warnings: [] }; const m = S.measure; let out = '';
  out += `结构  重量档 ${st.weightClasses?.join(', ') || '—'} · 实心面 ${st.solidPlane ? '有' : '无'} · 信号载体 ${st.signalCarriers?.join(', ') || '无'}\n`;
  if (m) { const c = m.coverage; out += `像素  纸 ${pc(c.paper)} 墨 ${pc(c.ink)} 中间 ${pc(c.mid)} 信号 ${(c.signal * 100).toFixed(2)}%${c.material ? ` 材质 ${pc(c.material)}` : ''} 中间调 ${pc(m.midtone)}\n九格  ${m.grid.map(pc).join(' ')}  最密 ${pc(m.densest)} 最空 ${pc(m.emptiest)}\n`; if (m.apparatus) out += `装置  ${Object.entries(m.apparatus.strokes).map(([k, v]) => `${k} ${pc(v)}`).join(' ')} → ${m.apparatus.classesPresent.join(', ') || '无'}\n`; if (m.interweave) out += `穿插  装置覆盖主体 ${pc(m.interweave.apparatusOverSubject)}\n`; out += `信号块 ${m.signalBlobPx}px\n`; }
  const warns = m ? m.warnings : st.warnings; out += '\n' + (warns.length ? warns.map((w) => `<span class="warn">! ${esc(w)}</span>`).join('\n') : '<span class="ok">没有警告</span>');
  box.innerHTML = out;
}
const pc = (v) => `${Math.round(v * 100)}%`;

// ---------- top bar ----------
function toggle(btn, key) { btn.addEventListener('click', () => { S.show[key] = !S.show[key]; btn.setAttribute('aria-pressed', S.show[key]); render(); }); }
toggle($('#bSkel'), 'skeleton'); toggle($('#bFlow'), 'flow'); toggle($('#bGrid'), 'grid'); toggle($('#bHeat'), 'heat');
$('#zoom').addEventListener('change', (e) => { S.zoom = e.target.value; applyZoom(); drawHandles(); });
$('#bPause').addEventListener('click', (e) => { S.paused = !S.paused; e.target.setAttribute('aria-pressed', S.paused); $('#live').textContent = S.paused ? 'paused' : 'live'; });
$('#bMeasure').addEventListener('click', async (e) => { e.target.disabled = true; status('测量中（Playwright 截四张图）…'); try { const m = await fetch('/api/measure', { method: 'POST' }).then((x) => x.json()); if (m.error) throw new Error(m.error); S.measure = m; S.show.heat = true; $('#bHeat').setAttribute('aria-pressed', 'true'); render(); report(); status(`测量完成 ${time()}`); } catch (err) { status(`测量失败：${err.message}`); } e.target.disabled = false; });
$('#bShot').addEventListener('click', async (e) => { e.target.disabled = true; try { const layers = [...S.layers].join(','); const r = await fetch(`/api/shot?layers=${encodeURIComponent(layers)}${S.show.skeleton || S.show.flow ? '&wire=1' : ''}`, { method: 'POST' }).then((x) => x.json()); if (r.error) throw new Error(r.error); status(`截图 → ${r.out}`); } catch (err) { status(`截图失败：${err.message}`); } e.target.disabled = false; });
$('#bRef').addEventListener('click', async (e) => { const open = $('#refWrap').classList.toggle('open'); e.target.setAttribute('aria-pressed', open); if (open && !$('#refs').children.length) { const refs = await fetch('/api/refs').then((x) => x.json()); if (!refs.length) $('#refs').textContent = '启动时加 --refs <目录>'; for (const r of refs) { const im = document.createElement('img'); im.src = r.url; im.title = r.name; im.addEventListener('click', () => { $('#refs').querySelectorAll('img').forEach((x) => x.classList.remove('on')); im.classList.add('on'); const big = $('#refBig'); big.src = r.url; big.hidden = false; applyZoom(); }); $('#refs').appendChild(im); } } applyZoom(); });
for (const l of LAYER_ORDER) { if (l === 'quiet') continue; const b = document.createElement('button'); b.textContent = LAYER_LABEL[l] || l; b.setAttribute('aria-pressed', 'true'); b.title = `layer ${l}`; b.addEventListener('click', () => { if (S.layers.has(l)) S.layers.delete(l); else S.layers.add(l); b.setAttribute('aria-pressed', S.layers.has(l)); render(); }); $('#layers').appendChild(b); }
window.addEventListener('keydown', async (e) => {
  if (e.target.matches('input,textarea,select')) return;
  if (e.key === 'Escape') select(-1);
  else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel >= 0) { S.spec.elements.splice(S.sel, 1); S.sel = -1; commit('delete'); }
  else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); const files = await fetch('/api/history').then((x) => x.json()); if (!files.length) return status('没有历史'); const r = await fetch('/api/restore', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ file: files[0] }) }).then((x) => x.json()); if (r.error) return status(r.error); await load(); status(`已恢复 ${files[0]}`); }
  else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && S.sel >= 0) { e.preventDefault(); materialize(S.sel); const el = S.spec.elements[S.sel]; const b = { ...elementBox(el, S.spec.canvas.w, S.spec.canvas.h) }; const d = e.shiftKey ? 10 : 1; if (e.key === 'ArrowLeft') b.x -= d; if (e.key === 'ArrowRight') b.x += d; if (e.key === 'ArrowUp') b.y -= d; if (e.key === 'ArrowDown') b.y += d; setBox(el, b); commit('nudge'); }
});
window.addEventListener('resize', () => { if (S.spec) { applyZoom(); drawHandles(); } });

await load(); await poll(); setInterval(poll, 700);
