# KCL archetypes

Three layout archetypes cover the idiom. Each lists its anchor, axis, rhythm, overflow, type zones, default proportions and reflow rules. Record the chosen archetype in the brief (LAY-1). Proportions are defaults (GOV-3).

## 1. Scroll Bands (分段长卷)

A vertical sequence of closed scenes separated by dividing planes. The web-native form: each band is a viewport-high composition and the page reads as a long scroll.

```
┌────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  bar
│  ·                      ○      │
│   ·   [SUBJECT A]    ○         │  band I   horizon at 62%
│ ───·──────────────○────────────│
│      ·        ○     ╱          │
│ ▓▓▓▓▓▓▓▓·▓▓▓▓▓▓▓▓▓╱▓▓▓▓▓▓▓▓▓▓ │  bar  ← rhythm path and diagonal cross the bar (overflow)
│          ·      ╱              │
│        ○      ╱  [SUBJECT B]   │  band II  horizon at 38%
│ ─────────────╱─────────────────│
│  mark      ╱            mark   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  bar
└────────────────────────────────┘
```

| Role | Default |
| --- | --- |
| Band height | 80–100vh; the first band 100vh |
| Dividing bar | 3–5vh, full bleed, ink; a band is closed by two bars |
| Horizon | one horizontal construction line per band at 38% or 62% of band height, alternating |
| Subject anchor | alternates left / right band to band; subject bleeds off its near edge |
| Diagonal family | one angle for the whole page; lines cross bars and run through at least two bands |
| Rhythm path | one path crossing two bands, points stepping toward the later band |
| Overflow | per band: the diagonal or the rhythm path, plus one subject part crossing a bar |
| Soft element | one per page, placed at the band transition it should bridge |
| Mark type | band folio and apparatus text in the two outer corners of each band |
| Voice type | at most two sentences per band, in the band's quiet zone opposite the subject |
| Plane type | one per page, behind a subject, clipped by the band's bars |

**Reflow.** Below 900px: bands keep order and horizon; the subject scales to width and keeps its bleed edge; the diagonal angle is preserved (recompute endpoints from the band box); bars thin to 2vh; mark type collapses to the top corners only; the plane type scales with `vw` and may clip further. Never squash the band to fit; let it grow in height.

## 2. Icon Center (中心圣像)

A fixed-aspect stage, letterboxed in the viewport, with strict bilateral symmetry of Plane and System. The subject stands in a central container; nested frames pull the eye inward; text sits at the edges as registration marks.

```
┌────────────────────────────────────────┐
│ ✦ mark                          mark ✦ │  outer frame inset 2%
│   ┌──────────────────────────────────┐ │
│   │ ((( ))) ───╱  P L A N E  ╲─── ((( ))) │  plane type behind, clipped by circle
│   │          ╱  ┌─────────┐  ╲          │
│   │   voice ─   │ ○ ring  │   ─ voice  │  side midpoints
│   │          ╲  │ SUBJECT │  ╱          │  container 60% of stage height
│   │  ▓▓▓▓▓▓▓▓▓▓▓│  ▓▓▓▓   │▓▓▓▓▓▓▓▓▓▓ │  label bar across the midline
│   │             └─────────┘            │
│   │              TITLE MARK            │
│   └──────────────────────────────────┘ │
│ ✦ mark                          mark ✦ │
└────────────────────────────────────────┘
```

| Role | Default |
| --- | --- |
| Stage | 16:9, `aspect-ratio` box centered, width `min(100vw, 177.8vh)` |
| Outer frame | inset 2% of stage width, 1px ink or signal; corners may carry marks |
| Container | circle, diameter 60% of stage height, centered; filled with signal in Duotone, outlined in Mono |
| Inner ring | concentric with the container at 70–80% of its diameter; a radial burst between ring and container is optional |
| Label bar | ink bar 4–6% of stage height across the container's midline, carrying one mark-type word |
| Wings | two mirrored elements (radial fans, line arrays, subject halves) spanning from the container to the frame |
| Rhythm path | optional, on the vertical axis only |
| Subject | one, centered, in two processing levels (MAT-2); may be offset downward so it rises into the circle |
| Plane type | the title behind the subject, stretched vertically, clipped by the container or the frame |
| Mark type | four corners and two side midpoints; the full title in spaced caps below the container |
| Voice type | one sentence per side midpoint, mirrored |

**Reflow.** Portrait viewports: the stage becomes 4:5; wings fold inside the container as a single pair of marks; side-midpoint voice type moves below the title; corner marks collapse to top-left and bottom-right. Scaling the full 16:9 stage down is acceptable above 900px width.

## 3. Asymmetric Grid (非对称编排)

A Swiss column grid carrying one huge subject that bleeds off two edges, with plane type set on the opposite axis and voice type in a measured column. The most editorial of the three; the grid is visible through alignments, not through drawn lines.

```
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│ mark                     │ mark │  │
│                          │      │  │
│  SUB                     │  P   │  │
│  JECT  (bleeds off left  │  L   │  │  plane type vertical in cols 9–12
│        and bottom)       │  A   │  │
│        ╲                 │  N   │  │  diagonal corner-to-corner
│          ╲   ▓▓▓▓▓▓▓▓▓▓▓▓│  E   │  │  bar aligned to column edges
│            ╲ voice  ·  · │· ·   │  │  rhythm points along the diagonal
│ mark          ╲          │      │  │
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
```

| Role | Default |
| --- | --- |
| Grid | 12 columns, gutter 2% of width, outer margin 4% |
| Subject | occupies about 60% of width, bleeds off two adjacent edges |
| Plane type | vertical (`writing-mode: vertical-rl` or rotated) in the columns opposite the subject |
| Diagonal | corner to corner of the content area, hairline; a second parallel at the golden offset is optional |
| Bars | column-aligned ink blocks, 1–3 per stage, never full bleed |
| Rhythm path | along the diagonal |
| Voice type | 3–4 columns wide, in the quiet zone |
| Mark type | the four corners of the content area |

**Reflow.** 12 → 6 columns below 1100px, 6 → 4 below 720px; the subject keeps its two bleed edges; plane type stays vertical until 720px, then turns horizontal above the subject; bars re-snap to the new columns.

## Chaining

A scroll page may chain: an Icon Center stage as the opening band, followed by Scroll Bands, with an Asymmetric Grid band for the prose. The color mode may change only at a dividing bar (COL-3). The diagonal family and the signal hue stay constant across the whole page.
