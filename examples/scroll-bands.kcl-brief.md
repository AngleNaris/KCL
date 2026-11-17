# kcl-brief: Orders

## 1. Tension (IMG-1)

> Classical orders measured by a 27° survey.

- Subject register: Classical (Doric columns) and Natural (ridge, flock, contours), on the no-asset path.
- Apparatus: one 27° diagonal family, rhythm points, concentric rings, a surveyed crosshair.
- Why: the columns are regular; the survey lines cut them at an angle they never asked for.

## 2. Archetype and canvas (LAY-1)

- Archetype: Scroll Bands, three bands, dividing bars 4vh.
- Designed canvas: 1440 wide, three bands of 100vh (min 680px).
- Narrow width verified at: 768.
- Reflow: bars 2vh, bottom marks hidden, plane type 32vw, subjects keep bleed edges via `slice`.

## 3. Color (COL)

- Mode: Mono. `--paper #f3efe6` · `--ink #141414` · `--signal #ff3b1f`.
- Why vermilion: a warm cut against cold stone; the reference habit of blue is deliberately not inherited.

## 4. Skeleton sketch (SKL)

```
bar ───────────────────────────────────────────
 I   ║   ║ ORDERS (outline, 1.8×) ║   ║   flock ↗
     ║   ║ ▓▓ ink plane 62% → bar, negative ridge inside ▓▓
bar ──── columns overflow both bars ────────────
 II  ▓ plane 38%/24% ▓     (( rings r 220–460 ))  ● rhythm 7 pts
     ridge line full width · dot-screen ridge right half
     ~~~ vermilion ribbon crosses bar ~~~
bar ───────────────────────────────────────────
 III   voice plate          contours (11) + crosshair
       序 ghost 44vw                [ signal frame ]
bar ───────────────────────────────────────────
```

- Diagonal family: 27°, two lines plus one perpendicular per band.
- Rhythm path: band II top-left to band III, 7 points, ratio 1.45, start 3.5.
- Overflow: I columns through both bars; II ribbon and rings through the bar; III rhythm points entering from II.
- Scale pair: full-height column vs 7px bird (≈1:140).

## 5. Assets (MAT, GOV-4)

| Asset | Source and license | Register | Processing levels | Output |
| --- | --- | --- | --- | --- |
| Doric column | hand-authored SVG symbol, original | Classical | vector | inline |
| Ridge | `compose.mjs ridge --seed 3 / 21` | Natural | negative (I), line + dot screen (II) | inline |
| Flock | `compose.mjs flock --seed 11` | Natural | silhouette | inline |
| Contours | `compose.mjs contours --seed 5` | Technical | line | inline |

## 6. Type (TYP)

- Display Bodoni Moda 900 / text Space Mono / CJK Noto Serif SC subset.
- Plane type: ORDERS outlined, scaleY 1.8, clipped by band I; 序 as ghost in band III.
- Mark type: band folios, Parthenon coordinates 37°58′N 23°43′E (real), tool parameters (real), "Interval 355" (declared fiction).
- Voice: three sentences across three bands, on paper plates.

## 7. Finish (TEX, MOT)

- Overlay: grain, alpha 0.10 at 55% layer opacity.
- Soft element: the vermilion ribbon in band II, blur 3, with a 5px hard core.
- Motion: lines draw in once at load (the allowed settle). Loops per band: I flock drift 47s + stars twinkle 2.9s; II rings rotate 180s + ribbon core flows 11s; III contours rotate 320s reverse + stars twinkle. Grain reseeds at 0.8s as the overlay. All paused under reduced motion.

## 8. Decisions and deviations (GOV-3)

| Date | Decision or deviation | Rule | Reason |
| --- | --- | --- | --- |
| 2026-11-15 | Voice sentences sit on paper plates that cut construction lines | LAY-2 | the plate is the quiet zone; moving text away from lines was impossible in band I |
| 2026-11-15 | Band II right ridge filled with a dot screen instead of solid ink | SKL-4, MAT-1 | solid ink merged with the bar into one slab |

## 9. Verification (VER)

| Check | Level | Status | Evidence |
| --- | --- | --- | --- |
| Screenshot at designed canvas | required | pass | 1440 full page, inspected |
| Screenshot at narrow width | required | pass | 768 full page, inspected |
| Ten tells walked | required | pass | none remaining after plates and ink rebalance |
| Signal fraction | advisory | recorded | see audit in the report |
| Midtone fraction | advisory | recorded | see audit in the report |
| Hue count | advisory | recorded | 1 |
| Motion check (VER-4) | required | pass | 1440 full page, two frames 3s apart, changed fraction 0.0145, later frame inspected |
