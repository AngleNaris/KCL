import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, grid3, strokeHistogram, largestBlob, measure, judge } from '../measure.mjs';
import { encodePNG, decodePNG, imageSize } from '../png.mjs';

function img(w, h, paint) { const data = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b] = paint(x, y) || [243, 239, 230]; const o = (y * w + x) * 4; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255; } return { w, h, data }; }
const pal = { bg: '#f3efe6', fg: '#111111', signal: '#ff3b1f' };
const INK = [17, 17, 17], RED = [255, 59, 31];

test('classify separates paper, ink, signal and midtone', () => {
  const im = img(10, 10, (x, y) => (y < 5 ? INK : x < 5 ? RED : y > 7 ? [128, 128, 128] : null));
  const c = classify(im, pal); assert.equal(c.counts[1], 50); assert.equal(c.counts[2], 25); assert.equal(c.counts[3], 10); assert.equal(c.counts[0], 15);
});
test('grid3 finds the dense and the empty cell', () => {
  const im = img(90, 90, (x, y) => (x < 30 && y < 30 ? INK : null)); const c = classify(im, pal); const g = grid3(c.cls, 90, 90, 'any'); assert.equal(g[0], 1); assert.equal(g[8], 0);
});
test('strokeHistogram buckets a hairline, a rule and a plane', () => {
  const im = img(200, 200, (x, y) => (y === 10 ? INK : y >= 50 && y < 56 ? INK : x >= 100 && y >= 100 ? INK : null)); const c = classify(im, pal); const h = strokeHistogram(c.cls, 200, 200, 1, 1);
  assert.ok(h.hairline > 0 && h.rule > 0 && h.plane > 0.8, JSON.stringify(h)); assert.equal(h.band, 0);
});
test('largestBlob measures the biggest signal patch', () => {
  const im = img(100, 100, (x, y) => ((x < 20 && y < 20) || (x > 90 && y > 90) ? RED : null)); const c = classify(im, pal); const b = largestBlob(c.cls, 100, 100, 2, 1); assert.equal(b.box.w, 20); assert.equal(b.fraction, 0.04);
});
test('measure + judge flag the hairline-only plate and pass a weighted one', () => {
  const W = 300, H = 300;
  const weak = img(W, H, (x, y) => (y === 100 || x === 100 ? INK : x === 150 && y === 150 ? RED : null));
  const m = measure({ full: weak, apparatus: weak }, {}, pal); const warn = judge(m).join('\n');
  assert.match(warn, /空纸|没有一个地方真正密/); assert.match(warn, /SKL-14/);
  const strong = img(W, H, (x, y) => (x < 100 ? INK : y >= 140 && y < 160 && x < 250 ? RED : y === 200 ? INK : (y > 220 && y < 226) ? INK : null));
  const m2 = measure({ full: strong, apparatus: strong }, {}, pal); assert.ok(m2.coverage.signal > 0.01); assert.ok(m2.apparatus.classesPresent.includes('plane')); assert.doesNotMatch(judge(m2).join('\n'), /信号色只占/);
});
test('png encode/decode round trip and imageSize', () => {
  const im = img(7, 5, (x, y) => [x * 30, y * 50, 7]); const png = encodePNG(im); const back = decodePNG(png); assert.equal(back.w, 7); assert.deepEqual([...back.data.slice(0, 8)], [...im.data.slice(0, 8)]);
  assert.deepEqual(imageSize(png), { w: 7, h: 5, type: 'png' });
  assert.equal(imageSize(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="34"></svg>')).w, 12);
});
