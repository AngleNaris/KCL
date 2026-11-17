// Pixel diagnostics for a rendered plate (VER-6). Works on RGBA buffers from any source (Playwright shot, canvas).
// Input: layered shots { full, subject?, apparatus?, signal? } each { w, h, data }, the normalized spec and options.
// Output is plain numbers the model and the user can read; thresholds live in the caller (plate.mjs / studio).

function hex(c) { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || '').trim()); if (!m) return [0, 0, 0]; let s = m[1]; if (s.length === 3) s = s.split('').map((x) => x + x).join(''); return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; }
const dist = (a, r, g, b) => Math.abs(a[0] - r) + Math.abs(a[1] - g) + Math.abs(a[2] - b);
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

export function classify(img, pal, tol = 60) {
  const { w, h, data } = img; const bg = hex(pal.bg), fg = hex(pal.fg), sig = hex(pal.signal), sig2 = pal.signal2 ? hex(pal.signal2) : sig;
  const cls = new Uint8Array(w * h); // 0 bg, 1 ink, 2 signal, 3 mid, 4 signal2 (material)
  const counts = [0, 0, 0, 0, 0]; const hasSig2 = !!pal.signal2 && pal.signal2 !== pal.signal; const lumHist = new Uint32Array(16);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    const r = data[p], g = data[p + 1], b = data[p + 2];
    let c; if (dist(bg, r, g, b) < tol) c = 0; else if (dist(sig, r, g, b) < tol * 1.3) c = 2; else if (hasSig2 && dist(sig2, r, g, b) < tol * 1.3) c = 4; else if (dist(fg, r, g, b) < tol * 1.6) c = 1; else c = 3;
    cls[i] = c; counts[c]++; lumHist[Math.min(15, Math.floor(lum(r, g, b) * 16))]++;
  }
  return { cls, counts, lumHist, w, h };
}

export function grid3(cls, w, h, want = 1) {
  const cells = []; for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) { const x0 = Math.floor(gx * w / 3), x1 = Math.floor((gx + 1) * w / 3), y0 = Math.floor(gy * h / 3), y1 = Math.floor((gy + 1) * h / 3); let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (cls[y * w + x] !== 0 && (want === null || cls[y * w + x] === want || want === 'any')) n++; cells.push(n / ((x1 - x0) * (y1 - y0))); }
  return cells;
}

// Stroke weight: for each foreground pixel take the shorter run (horizontal/vertical) through it; histogram by ladder rungs.
export function strokeHistogram(cls, w, h, k = 1, sample = 2) {
  const runsH = new Uint16Array(w * h), runsV = new Uint16Array(w * h);
  for (let y = 0; y < h; y++) { let x = 0; while (x < w) { if (cls[y * w + x] === 0) { x++; continue; } let x2 = x; while (x2 < w && cls[y * w + x2] !== 0) x2++; for (let i = x; i < x2; i++) runsH[y * w + i] = x2 - x; x = x2; } }
  for (let x = 0; x < w; x++) { let y = 0; while (y < h) { if (cls[y * w + x] === 0) { y++; continue; } let y2 = y; while (y2 < h && cls[y2 * w + x] !== 0) y2++; for (let i = y; i < y2; i++) runsV[i * w + x] = y2 - y; y = y2; } }
  const rungs = { hairline: 1.2 * k, line: 3.2 * k, rule: 8 * k, band: 24 * k }; const hist = { hairline: 0, line: 0, rule: 0, band: 0, plane: 0 }; let total = 0;
  for (let y = 0; y < h; y += sample) for (let x = 0; x < w; x += sample) { const i = y * w + x; if (cls[i] === 0) continue; const m = Math.min(runsH[i], runsV[i]); total++; if (m <= rungs.hairline) hist.hairline++; else if (m <= rungs.line) hist.line++; else if (m <= rungs.rule) hist.rule++; else if (m <= rungs.band) hist.band++; else hist.plane++; }
  const out = {}; for (const key of Object.keys(hist)) out[key] = total ? +(hist[key] / total).toFixed(3) : 0; return out;
}

// Largest connected blob of a class (4-neighbour, on a downsampled grid for speed). Returns area fraction and bbox.
export function largestBlob(cls, w, h, want = 2, step = 2) {
  const gw = Math.ceil(w / step), gh = Math.ceil(h / step); const seen = new Uint8Array(gw * gh); let best = { area: 0, box: null };
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const gi = gy * gw + gx; if (seen[gi] || cls[(gy * step) * w + gx * step] !== want) continue;
    const stack = [gi]; seen[gi] = 1; let area = 0, x0 = gx, x1 = gx, y0 = gy, y1 = gy;
    while (stack.length) { const c = stack.pop(); const cy = Math.floor(c / gw), cx = c % gw; area++; if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue; const ni = ny * gw + nx; if (seen[ni] || cls[(ny * step) * w + nx * step] !== want) continue; seen[ni] = 1; stack.push(ni); } }
    if (area > best.area) best = { area, box: { x: x0 * step, y: y0 * step, w: (x1 - x0 + 1) * step, h: (y1 - y0 + 1) * step } };
  }
  return { fraction: +(best.area * step * step / (w * h)).toFixed(4), box: best.box };
}

export function measure(shots, spec, pal, opts = {}) {
  const full = shots.full; const { w, h } = full; const S = Math.min(w, h); const k = S / 900 * (opts.scale || 1);
  const C = classify(full, pal, opts.tol); const n = w * h;
  const out = { w, h, scale: opts.scale || 1 };
  out.coverage = { paper: +(C.counts[0] / n).toFixed(3), ink: +(C.counts[1] / n).toFixed(3), signal: +(C.counts[2] / n).toFixed(4), mid: +(C.counts[3] / n).toFixed(3), material: +(C.counts[4] / n).toFixed(3) };
  const cells = grid3(C.cls, w, h, 'any'); out.grid = cells.map((c) => +c.toFixed(3)); out.densest = Math.max(...cells); out.emptiest = Math.min(...cells); out.emptyCells = cells.filter((c) => c < 0.04).length;
  out.signalBlob = largestBlob(C.cls, w, h, 2); out.signalBlobPx = out.signalBlob.box ? Math.max(out.signalBlob.box.w, out.signalBlob.box.h) : 0;
  const midLum = C.lumHist.slice(4, 12).reduce((a, b) => a + b, 0); out.midtone = +(midLum / n).toFixed(3);
  if (shots.apparatus) { const A = classify(shots.apparatus, pal, opts.tol); out.apparatus = { ink: +((A.counts[1] + A.counts[2] + A.counts[3] + A.counts[4]) / n).toFixed(3), strokes: strokeHistogram(A.cls, w, h, k) }; const appPx = Math.max(1, out.apparatus.ink * n); const present = Object.entries(out.apparatus.strokes).filter(([, v]) => v >= 0.02 || v * appPx >= 0.001 * n).map(([key]) => key); out.apparatus.classesPresent = present; if (shots.subject) { const Sj = classify(shots.subject, pal, opts.tol); let cross = 0, sub = 0, app = 0; for (let i = 0; i < n; i++) { const a = A.cls[i] !== 0, s = Sj.cls[i] !== 0; if (a) app++; if (s) sub++; if (a && s) cross++; } out.interweave = { subjectPx: +(sub / n).toFixed(3), apparatusOverSubject: sub ? +(cross / sub).toFixed(4) : 0, apparatusInside: app ? +(cross / app).toFixed(3) : 0 }; } }
  if (shots.subject && !out.interweave) { const Sj = classify(shots.subject, pal, opts.tol); out.subjectPx = +((n - Sj.counts[0]) / n).toFixed(3); }
  return out;
}

// Turn the numbers into the review language (review.md tells). Thresholds are deliberately plain.
export function judge(m, structure = {}) {
  const warn = [];
  if (structure.mode === 'hybrid') return [...(structure.warnings || [])];
  if (m.coverage.paper < 0.3) warn.push(`VER-6 留白只剩 ${Math.round(m.coverage.paper * 100)}%（目标 ≥ 30%）`);
  if (m.coverage.paper > 0.72) warn.push(`VER-6/SKL-16 画面 ${Math.round(m.coverage.paper * 100)}% 是空纸（参照作品 50–70%）：核对是否符合留白意图；不要为覆盖率添加装饰`);
  if (m.densest < 0.4) warn.push(`VER-6/SKL-12 最密的格只有 ${Math.round(m.densest * 100)}% 墨（参照作品 45–85%）：没有一个地方真正密`);
  if (m.grid.filter((g) => g < 0.08).length > 3) warn.push(`VER-6/SKL-16 九格里有 ${m.grid.filter((g) => g < 0.08).length} 格几乎空白：核对负形与配重，不以空格数判断完成度`);
  if (m.emptiest > 0.28) warn.push(`VER-6 最空的格也有 ${Math.round(m.emptiest * 100)}% 墨（参照作品 7–28%）：缺一个真正的空区`);
  if (m.coverage.signal < 0.001) warn.push(`COL-6 信号色只占 ${(m.coverage.signal * 100).toFixed(2)}%：看不见`);
  if (m.coverage.signal > 0.08) warn.push(`COL-6 信号色占 ${(m.coverage.signal * 100).toFixed(1)}%：不再是信号`);
  if (m.signalBlobPx && m.signalBlobPx < 0.03 * Math.min(m.w, m.h)) warn.push(`COL-6 最大的信号块只有 ${m.signalBlobPx}px：信号只在标点上`);
  if (m.midtone > 0.2) warn.push(`MAT-1 中间调占 ${Math.round(m.midtone * 100)}%：像照片，不像版画`);
  if (m.apparatus) { const p = m.apparatus.classesPresent || []; if (p.length < 3) warn.push(`SKL-14 像素里装置只有 ${p.length} 个重量档（${p.join(', ') || '无'}）`); if (!p.includes('band') && !p.includes('plane')) warn.push('SKL-14 装置里没有 band 或 plane 级的重量：全是线'); }
  if (m.interweave) { if (m.interweave.apparatusOverSubject < 0.01) warn.push(`SKL-11 装置只覆盖主体 ${(m.interweave.apparatusOverSubject * 100).toFixed(1)}% 的像素：没有穿插`); }
  return warn.concat(structure.warnings || []);
}
