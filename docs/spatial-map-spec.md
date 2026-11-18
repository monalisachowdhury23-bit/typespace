# Font Universe — Spatial Map Specification

**Version 2.0 · Creative direction spec · Implementation target: React 18 + TS + GSAP 3 + SVG**

> Typography isn't categories. It's a continuous space. This map lets you feel where fonts live and why they relate — including across scripts.

Every decision below is final. Where a number appears, use that number. Where copy appears in quotes, use that copy verbatim. The companion file `font-universe-data.md` contains the complete 150-font dataset this spec renders.

---

## 1. Design principles (the taste contract)

1. **Data honesty.** A font's name is never rendered in a UI font. Every node, every specimen, every index entry renders a font's name *in that font*. This is the single most important rule in the project.
2. **Mass and momentum.** Nothing appears or disappears — things *arrive* and *depart*. Arrivals overshoot slightly (`back.out`), departures accelerate (`power2.in`). Nothing ever animates linearly.
3. **The field is a place, not a chart.** No visible gridlines, no tick marks, no legend box. The axes exist as whispered labels at the canvas edges and as the felt logic of where things sit.
4. **Devanagari is a first-class script.** Indic fonts get their own visual dialect (shirorekha treatment, bilingual specimens), not a badge.
5. **Restraint at rest, richness on intent.** The idle field is quiet. Every layer of information (connections, annotations, metadata) is earned by cursor proximity or selection.

---

## 2. Coordinate system

### 2.1 Semantic axes

- **X axis** = `humanistGeometric`, −1.0 (humanist: drawn, warm, calligraphic) → +1.0 (geometric: constructed, rational, precise).
- **Y axis** = `displayAffinity`, 10 (display/expressive, top) → 0 (text/workhorse, bottom).

### 2.2 Mapping to viewport

```ts
// vw/vh = canvas dimensions in px
x = ((font.humanistGeometric + 1) / 2) * (0.84 * vw) + 0.08 * vw;   // 8%–92% band
y = (1 - font.displayAffinity / 10) * (0.80 * vh) + 0.10 * vh;      // 10%–90% band
```

### 2.3 Deterministic jitter

Pure semantic placement stacks fonts with identical scores. Apply jitter derived from a hash of `font.id` (FNV-1a → normalized to [−1, 1]): `x += jx * 0.022 * vw; y += jy * 0.030 * vh`. Deterministic so the map is identical on every load — people should be able to remember where Inter lives.

### 2.4 Collision relaxation

After jitter, run 24 iterations of pairwise repulsion. Minimum separation = half the sum of the two nodes' rendered text widths + 28px horizontal, 34px vertical. Resolve overlaps by pushing **vertically first** (Y is a coarser semantic than X — a font can slide within its display band without lying, but sliding horizontally changes its humanist/geometric story). Clamp all nodes to the 8–92% / 10–90% band. Compute once at mount and on debounced resize (250ms); cache result.

### 2.5 Axis whisper labels

Four labels, fixed to canvas edges, set in `Switzer` 11px, `letter-spacing: 0.18em`, uppercase, `rgba(236,233,228,0.22)`:

- Top center: `DISPLAY · EXPRESSIVE`
- Bottom center: `TEXT · WORKHORSE`
- Left middle (rotated −90°): `HUMANIST · DRAWN`
- Right middle (rotated 90°): `GEOMETRIC · CONSTRUCTED`

No axis lines. No center crosshair. The labels are the entire visible structure.

---

## 3. Color tokens

```css
--bg:            #0a0a0a;
--ink:           #ECE9E4;                    /* warm off-white, never pure white */
--ink-dim:       rgba(236, 233, 228, 0.38);
--ink-ghost:     rgba(236, 233, 228, 0.14);
--hairline:      rgba(236, 233, 228, 0.16);
--rel-kinship:   #8FB0CE;   /* cool slate — structural similarity */
--rel-contrast:  #D9A05B;   /* warm amber — productive tension */
--rel-bridge:    #E06B3C;   /* ember — shared Devanagari script */
--select-ring:   rgba(217, 160, 91, 0.35);
```

Relationship colors are used at low intensity (lines at 55% opacity, annotations at full). The field itself stays monochrome — color *means* relationship, nothing else.

---

## 4. Node design

A node is a **nameplate**, not a label. Three layered parts, grouped in one `<g>` per font:

### 4.1 The name

The font's display name, set in the font itself, `--ink`. Size by tier (see 4.4). `font-weight: 400` (500 for fonts whose 400 reads thin at small sizes — flag per-font is unnecessary; use 400 everywhere and let the font's own color show).

### 4.2 The signature glyph watermark

Behind the name: the font's `signatureGlyph`, same typeface, at **3.2× the name's font-size**, positioned so its optical center sits 0.4em above and 0.6em right of the name's end. Fill `--ink` at **4% opacity** idle. It reads as a ghost — the font's fingerprint hovering behind its name. Clipped to a generous bounding box (no `overflow` bleeding into neighbors). For Indic fonts the watermark is a Devanagari character (already specified per-font in the data).

### 4.3 The baseline tick

A 1px horizontal line under the name, `--ink-ghost`, whose **length encodes `visualWeight`**: `length = 16 + visualWeight * 4` px, left-aligned to the name's start. It's a subliminal weight gauge — heavier fonts carry a longer tick.

**Indic exception — the shirorekha:** for fonts flagged `indic: true`, the tick renders **above** the name instead of below, flush to the cap line, at 1.5px and `rgba(224,107,60,0.35)`. Devanagari letters hang from their headline; so do these nodes. This is the quiet tell that a font belongs to the script, visible even at idle.

### 4.4 Prominence tiers

Every font carries `tier: 1 | 2 | 3` in the data.

| Tier | Count | Name size | Idle opacity | Watermark |
|------|-------|-----------|--------------|-----------|
| 1 | 16 | 22px | 1.0 | yes |
| 2 | ~50 | 16px | 0.72 | yes |
| 3 | rest | 13px | 0.45 | no (appears on hover only) |

Tiers prevent 150 nodes from screaming at once: the eye lands on ~16 anchors, reads ~50 on second pass, and discovers the rest by exploring. Tier is editorial judgment baked into the data, not computed.

---

## 5. The idle field

- **Background:** flat `--bg`. No gradient, no vignette, no starfield particles. The fonts *are* the stars; decoration competes with them.
- **Ambient drift:** every node moves on an individual slow orbit: `gsap.to(node, { x: '+=jx*3', y: '+=jy*5', duration: rand(6, 11), ease: 'sine.inOut', yoyo: true, repeat: -1 })` where jx/jy come from the node's hash, staggered start offsets `rand(0, 4)`. Amplitude is 3–5px — felt, not seen. The field breathes; it does not float around.
- **Watermark breathing:** tier 1–2 watermarks oscillate opacity 0.03 ↔ 0.05 over 7s, `sine.inOut`, yoyo, desynchronized by hash offset.
- **Pause ambient timelines when `document.hidden`** and under `prefers-reduced-motion` (see §10).
- All ambient motion drives `transform` only. One shared `gsap.ticker` context; no per-frame React renders.

---

## 6. Hover state

Trigger: pointer within 44px of a node's name bounding box (use an invisible padded hit rect, not the text path).

Simultaneously (all 0.35s unless noted):

1. **Node lift:** scale 1 → 1.12 around its own center, `back.out(2)`. Opacity → 1.0 regardless of tier. Tier 3 nodes also grow to 16px equivalent (animate `scale`, not `font-size`).
2. **Watermark surfaces:** opacity → 0.12, scale → 1.06, `power2.out`. Tier 3 watermark fades in from 0.
3. **Metadata whisper:** a single line below the baseline tick, Switzer 10px `--ink-dim`, fades in at 0.15s delay: the font's `specimen` phrase (e.g. "Wonky old soul"). No card. No box.
4. **Connection lines draw** (see §7).
5. **Neighbors make room:** nodes within 120px of the hovered node ease 8px directly away from it, 0.4s `power2.out`, and return on unhover. Small, but it makes the node feel like a person others step aside for.
6. **Field response:** all non-connected nodes dim to 0.75× their tier opacity, 0.3s. Subtle — the room quiets, it doesn't go dark.

**Indic hover addition:** the name crossfades to a stacked bilingual lockup — Devanagari name above (same font, same size), Latin name below at 0.7× size in `--ink-dim`. Crossfade 0.4s `power2.inOut`. Example: hovering Mukta shows **मुक्ता** with "Mukta" beneath. The Devanagari leads; the Latin annotates. Reverts on unhover.

Unhover: everything reverses at 0.25s `power2.in` — departures are faster than arrivals, always.

---

## 7. Connection lines

When a node is hovered or anchored, lines appear to its **top 5 partners by compatibility score** (§7.4). Never fewer than 4 (pad from ranked list), never more than 6 (an anchored Indic font may add a 6th bridge line, §9).

### 7.1 Geometry — tension curves

Each line is a quadratic Bézier from name-edge to name-edge (8px standoff from each text box). The control point offsets perpendicular to the chord by:

```
sag = chordLength * 0.18 * (1 - normalizedCompat)   // normalizedCompat ∈ [0,1] within the 5 shown
```

**Strong relationships pull taut and nearly straight; weaker ones hang slack.** The bow direction is always downward-perpendicular (gravity). This makes strength readable at a glance without a single label.

### 7.2 Visual treatment

- Stroke: 1px, relationship color (§7.3) at 55% opacity. No glow, no gradient stroke, no dashes at rest.
- Endpoint: a 2.5px filled circle in the relationship color at both ends.
- **Mid-line annotation:** at the curve's midpoint, a text chip — no background rect, just text with a 6px `--bg`-colored stroke behind it (paint-order trick) so the line breaks visually around it. Switzer 10px, letter-spacing 0.06em, relationship color at full opacity. Content per §7.5.

### 7.3 Relationship classification → color

```
if (both fonts indic)                         → bridge   (--rel-bridge)
else if (|ΔhumanistGeometric| ≤ 0.5)          → kinship  (--rel-kinship)
else                                          → contrast (--rel-contrast)
```

### 7.4 Compatibility score (drives partner ranking AND line tension)

```ts
function compat(a: UniverseFont, b: UniverseFont): number {
  const dAff = Math.abs(a.displayAffinity - b.displayAffinity);
  const dHG  = Math.abs(a.humanistGeometric - b.humanistGeometric);
  const dVW  = Math.abs(a.visualWeight - b.visualWeight);
  let s = 0;

  // Role separation: the best partners live 3–6 apart on the display axis
  s += 3.0 * Math.exp(-((dAff - 4.5) ** 2) / (2 * 1.8 ** 2));

  // Category complement
  if (complements(a.category, b.category)) s += 2.5;
  if (a.category === b.category && dAff < 2) s -= 2.0;   // redundancy penalty

  // Kinship OR deliberate contrast — never the mushy middle
  if (dHG <= 0.4)      s += 1.5 * (1 - dHG / 0.4);
  else if (dHG >= 1.0) s += 1.5 * Math.min((dHG - 1.0) / 0.6, 1);

  // Script bridge
  if (a.indic && b.indic) s += 1.25;

  // Weight rhythm: some weight difference keeps hierarchy honest
  if (dVW >= 2) s += 0.5;

  return s;
}

function complements(a: FontCategory, b: FontCategory): boolean {
  if (a === b) return false;
  const set = new Set([a, b]);
  if (set.has('serif') && set.has('sans-serif')) return true;
  if (set.has('display') && (set.has('sans-serif') || set.has('serif'))) return true;
  if (set.has('monospace') && (set.has('sans-serif') || set.has('serif'))) return true;
  return false;   // display↔monospace: no
}
```

Compute all pairwise scores once at mount (150² / 2 ≈ 11k comparisons — trivial), store top-8 per font.

### 7.5 Annotation copy — generated from templates

Format: `{role} · {structure}` and, when `dVW ≥ 3`, append ` · {weight}`. Middot-separated, no punctuation.

| Condition | role |
|---|---|
| dAff ≥ 3 | `display over text` (higher-affinity font is the display) |
| dAff < 3 | `peer roles` |

| Condition | structure |
|---|---|
| bridge | `Devanagari kin` |
| kinship, both hG < 0 | `both drawn` |
| kinship, both hG ≥ 0 | `both constructed` |
| contrast | `drawn against constructed` |

| Condition | weight |
|---|---|
| dVW ≥ 3 | `contrasting weight rhythm` |

Example rendered chip: `display over text · drawn against constructed · contrasting weight rhythm`

### 7.6 Animation

Lines draw via `stroke-dasharray`/`stroke-dashoffset`: 0.45s `power2.out`, staggered 0.05s **nearest partner first**. Endpoint dots pop in (`scale 0 → 1, back.out(2), 0.2s`) as the line reaches them. Annotation fades in + rises 8px (`power2.out`, 0.3s) triggered at the line's 70% draw point. On unhover, lines retract toward the source (`dashoffset` reverses) at 0.25s `power2.in`, annotations fade in 0.15s. Retraction beats redraw — the room remembers who was asking.

---

## 8. Anchored state (one font selected)

Click a node → it becomes the **anchor**. This is the hero animation of the piece.

### 8.1 Where it anchors

The anchor flies to **38% viewport width, 50% height** — deliberately off-center, leaving the right two-thirds as the stage for its orbit. It scales to 1.6× its tier size (min rendered size 28px) and its watermark surfaces to 0.10 opacity permanently while anchored.

### 8.2 The flight

Carry over the arc-flight DNA from v1. Two desynchronized tweens create the arc — no motion-path plugin needed:

```ts
gsap.to(node, { x: targetX, duration: 0.85, ease: 'power2.inOut' });
gsap.to(node, { y: targetY, duration: 0.85, ease: 'power3.inOut' });
gsap.to(node, { scale: anchorScale, duration: 0.85, ease: 'back.out(1.15)' });
```

The mismatched X/Y easings bow the path naturally. The `back.out` scale gives the landing its slight overshoot — mass arriving.

### 8.3 The field reorganizes

Simultaneously (start 0.1s after the anchor launches):

- **The orbit:** the anchor's top 12 compatible fonts move to positions on two rings around the anchor point — inner ring radius 230px (top 5, also the connected set), outer ring 340px (next 7). Angular placement: preserve each font's bearing from the anchor in the semantic layout, then relax to avoid overlap (min 24° separation). They keep their own typefaces and tier sizes; inner-ring opacity → 1.0, outer → 0.8.
- **The periphery:** all other fonts are repelled radially from the anchor by a factor of 1.35× their current distance (clamped to canvas bounds) and dim to 0.15 opacity. They remain barely legible — the universe doesn't vanish, it recedes.
- **Timing:** 1.1s, `power3.inOut`, stagger 0.015s ordered by distance-from-anchor ascending — the reorganization propagates outward like a wave. Inner-ring arrivals use `back.out(1.05)` on their final position for the faint settle.
- Connection lines to the top 5 redraw to the new geometry after arrival (draw-on per §7.6, starting at t=1.0s).
- Axis whisper labels dim to 0.06.
- Ambient drift continues for orbit fonts at half amplitude; periphery drift pauses.

### 8.4 Anchored UI

Below the anchor, one line in Switzer 11px `--ink-dim`: `"choose a partner — or press esc"`. Clicking any orbit font enters pairing state (§9 for Indic nuance, §10 for the specimen). Clicking a periphery font makes *it* the new anchor (full reorganization replays toward it). Clicking the background or pressing Escape returns to idle (§11.5).

---

## 9. Indic special behavior

Beyond the shirorekha tick (§4.3) and bilingual hover lockup (§6):

1. **Anchoring an Indic font** renders its anchored name as the bilingual stacked lockup permanently (Devanagari leading). Its orbit ranking adds the script-bridge bonus automatically (§7.4), so sibling Devanagari fonts surface among partners — and when they do, their line takes the ember `--rel-bridge` color with annotation `Devanagari kin`.
2. **A sixth line:** if an anchored Indic font has another Indic font in its top 8 that didn't make the top 5, draw one additional bridge line to it. The script's community is always visible from inside it.
3. **Anchored Indic fonts show a second whisper line** under the "choose a partner" prompt, Switzer 10px, `rgba(224,107,60,0.7)`: `"देवनागरी · dual-script"`.
4. **The pairing specimen** for any pair containing an Indic font uses the bilingual variant (§10.6).

Never a flag icon, never a globe icon, never the word "ethnic" or "exotic" anywhere in the interface.

---

## 10. Pairing state — the specimen

Second font clicked → the money moment. The field dims to 8% opacity (0.4s `power2.inOut`, non-interactive), and a **full-bleed specimen** materializes over it. Not a card, not a modal — it owns the viewport edge-to-edge, with 6vw side margins for text. A thin `--hairline` rule at the very top and bottom of the viewport frames it like a page torn from a foundry's specimen book.

**Role assignment:** the font with higher `displayAffinity` is the **display voice**; the other is the **text voice**. (Tie: the earlier-selected font is display.)

### 10.1 Structure — three bands

I'm taking the proposed split-specimen and reweighting it: the composed line is not a bridge *between* the columns, it is the **headline act at the top**. The relationship leads; the anatomy supports.

```
┌──────────────────────────────────────────────────────────┐
│  BAND 1 · THE COMPOSED LINE                    ~38vh      │
│  kicker (text voice, caps) → headline (display voice,     │
│  huge) → deck (text voice)                                │
├────────────────────────┬─────────────────────────────────┤
│  BAND 2 · ANATOMY      │                         ~44vh    │
│  display column        │  ⟂ hairline + chips │ text column│
├────────────────────────┴─────────────────────────────────┤
│  BAND 3 · RATIONALE FOOTER                     ~18vh      │
└──────────────────────────────────────────────────────────┘
```

### 10.2 Band 1 — the composed line

The pairing in its natural habitat: an editorial lockup.

- **Kicker:** text voice, 11px, uppercase, letter-spacing 0.2em, `--ink-dim`.
- **Headline:** display voice, `clamp(64px, 9vw, 128px)`, `--ink`, line-height 1.02, max 2 lines.
- **Deck:** text voice, 18px/1.5, `--ink-dim`, max-width 52ch.

Content comes from a fixed pool of five lockups, selected deterministically by `hash(idA + idB) % 5` — every pair gets a consistent, curated-feeling page. Use these verbatim:

| kicker | headline | deck |
|---|---|---|
| `FIELD NOTES · TYPE` | `Letters carry weather` | `Every typeface arrives with a climate of its own — the pairing decides the season.` |
| `SPECIMEN NO. 4` | `Two voices, one page` | `A headline speaks; a paragraph listens. Good pairs argue in private and agree in public.` |
| `ON CONTRAST` | `Friction makes the fit` | `The strongest pairings share a skeleton and disagree about everything else.` |
| `THE READING ROOM` | `Built to disappear` | `Display type earns the glance. Text type earns the hour. This page needs both.` |
| `PRESSED & PROOFED` | `Ink remembers the hand` | `Before the pixel there was the pen, and both of these faces know it.` |

**The headline is `contenteditable`.** Click it and type — the specimen becomes the visitor's own proof. A caret-shaped hint (`⌶ type here`) in Switzer 10px `--ink-ghost` appears at the headline's top-right for 3s after the specimen lands, then fades. Editing never persists; Escape restores.

### 10.3 Band 2 — the anatomy columns

Split 50/50, separated by a vertical `--hairline` rule.

**Left — the display voice, doing its thing:**
- Alphabet waterfall: `ABCDEFGHIJKLM` / `NOPQRSTUVWXYZ` on two lines at 40px, then `abcdefghijklmnopqrstuvwxyz` at 30px, `--ink`.
- Numerals + punctuation line: `0123456789 !?&%@·—` at 30px, `--ink-dim`.
- One word — `Emphasis` — repeated across the font's available weights (whatever loaded weights exist, ascending), 26px, baseline-aligned in a row.

**Right — the text voice, doing its thing:**
- A running paragraph, 15px/1.6, `--ink` at 0.85, max-width 44ch. Use this passage verbatim:
  > "The paragraph is where a typeface stops performing and starts working. At this size nobody admires letterforms; they fall through them into meaning. Count the fonts that survive this — the honest x-height, the even color, the rhythm that never once asks to be noticed."
- A UI moment beneath it: a fake interface fragment — a 13px label (`Account balance`), a 22px figure (`₹ 48,206.19`), a bordered ghost button (`Review transfer`, 13px, 1px `--hairline` border, 8px 20px padding). Proof the font holds up at interface scale.
- A tabular numerals line: `1,024 · 99.4% · 08:15:42` at 14px `--ink-dim`.

**Between the columns — three annotation chips**, hung on the hairline at 25% / 50% / 75% height. Each chip: Switzer 10px, relationship color, with the paint-order background-stroke trick from §7.2.

1. **The x-height overlay (the craft moment):** a lowercase `x` from *both* fonts rendered at the same 64px font-size, superimposed, display voice in `--rel-contrast` at 45%, text voice in `--rel-kinship` at 45%, blend `screen`. The chip label beneath: `x-height, same point size`. Viewers *see* the metric relationship, live, computed by the fonts themselves.
2. Structure chip: the §7.5 structure phrase (e.g. `drawn against constructed`).
3. Weight chip: `weight ${a.visualWeight} · ${b.visualWeight}` rendered as `weight 8 against 4`.

### 10.4 Band 3 — the rationale footer

Left-aligned: one generated sentence, text voice, 16px/1.5, `--ink`:

```
`${display.name} carries the ${dHG >= 1.0 ? 'argument' : 'melody'}; ${text.name} carries the reader.
${structurePhrase(a,b)} — ${dAff >= 3 ? 'a clean split of roles' : 'two peers taking turns'}.`
```

Right-aligned controls, Switzer 12px:
- `⇄ swap roles` — flips display/text assignment; bands 1–2 re-render with a 0.5s crossfade (`power2.inOut`). No layout animation, just content swap.
- `esc · back to the field`
- **Tension meter:** a 120px horizontal hairline with a 4px dot positioned at `dHG / 2` (0 = left = kinship, 1 = right = contrast), labeled `kin` / `tension` at the ends in 9px `--ink-ghost`.

### 10.5 Specimen entrance choreography

1. `t=0`: field dims to 0.08, 0.4s `power2.inOut`. Top/bottom hairline rules draw from center outward, 0.5s `power2.out`.
2. `t=0.15`: kicker fades up 12px, 0.4s `power2.out`.
3. `t=0.25`: headline words rise from below a clip line (overflow hidden per line, `yPercent: 100 → 0`), 0.7s `power4.out`, stagger 0.06/word. This is the signature move — the headline is *typeset* before your eyes.
4. `t=0.55`: deck fades up, 0.5s `power2.out`.
5. `t=0.7`: both anatomy columns fade up 16px, 0.6s `power3.out`, left column leading right by 0.12s. Annotation chips pop at 0.9s with `back.out(1.4)`, 0.25s, stagger 0.08.
6. `t=1.1`: rationale footer fades in, 0.4s.

Total ≈ 1.7s to full presence. It should feel like a page being composed, not a panel sliding in.

### 10.6 Bilingual specimen (one or both fonts Indic)

Band 1: the headline becomes Devanagari with a Latin echo — headline `टाइप बोलता है` in the display voice (if the display voice lacks Devanagari, the Indic font takes the headline regardless of affinity and roles annotate accordingly), and directly beneath at 0.35× size, the Latin translation `Type speaks` in the other font, `--ink-dim`. Deck (text voice, whichever script it owns): `दो लिपियाँ, एक आवाज़ — two scripts, one voice.` set as a single bilingual line.

Band 2, the Indic column waterfall replaces the Latin alphabet:
- `क ख ग घ ङ च छ ज झ ञ` / `ट ठ ड ढ ण त थ द ध न` at 40px
- `प फ ब भ म य र ल व श ष स ह` at 40px
- Matra line: `का कि की कु कू के कै को कौ कं कः` at 30px, `--ink-dim`
- Devanagari numerals beside Latin: `० १ २ ३ ४ ५ ६ ७ ८ ९ · 0 1 2 3 4 5 6 7 8 9` at 26px

Add a fourth annotation chip on the hairline: `shirorekha meets baseline` — with a live overlay of Devanagari `क` and Latin `k` at the same point size (same treatment as the x-height chip). The paragraph on the text side, if the text voice supports Devanagari, sets its first sentence in Hindi: `अनुच्छेद वह जगह है जहाँ टाइपफ़ेस प्रदर्शन बंद कर काम शुरू करता है।` followed by the English passage.

---

## 11. Motion choreography — the five moments

Global GSAP defaults: `gsap.defaults({ ease: 'power3.out', duration: 0.6 })`. All choreography lives in `src/animations/`, one module per moment.

### 11.1 Field entrance (load)

1. Fonts load progressively (§12). Nodes enter **as their font becomes ready** — never in a fallback face.
2. Axis whisper labels fade in first: 0.8s, `power2.inOut`, all four together at t=0.
3. Nodes: `opacity 0 → tier value`, `scale 0.6 → 1`, `y: '+=14' → 0`. Duration 0.9s. Ease `power3.out` for tiers 2–3; **tier 1 uses `back.out(1.2)`** — the anchors land with a touch of swagger.
4. Stagger: `{ each: 0.012, from: 'center', grid: 'auto' }` over the spatial positions — the field blooms outward from the middle. Late-loading fonts join with the same entrance individually.
5. Ambient drift timelines start per-node as each entrance completes. Full field presence within ~2.2s on a warm cache.

### 11.2 Hover → connections

Per §6 and §7.6. Key numbers: lift 0.35s `back.out(2)`; lines 0.45s `power2.out` stagger 0.05 nearest-first; annotations at 70% draw; everything reverses faster than it arrived (0.25s `power2.in`).

### 11.3 Click → field reorganization (the hero)

Per §8.2–8.3. Key numbers: anchor arc 0.85s (X `power2.inOut` / Y `power3.inOut` / scale `back.out(1.15)`); field wave 1.1s `power3.inOut` stagger 0.015 by distance; inner-ring settle `back.out(1.05)`; lines redraw at t=1.0s. Nothing else in the app is allowed to be this theatrical.

### 11.4 Two selected → specimen materializes

Per §10.5. The chosen partner and the anchor fly toward each other briefly (0.3s, `power2.in`, each moving 40px along the line between them) and crossfade into the specimen at their meeting — the pairing literally begins with the two nodes committing to each other before the page composes.

### 11.5 Deselect / Escape → return to idle

Departures accelerate; the return is brisk, never a slow rewind.

1. Specimen (if present): all bands exit together, `opacity → 0, y: '-=10'`, 0.35s `power2.in`. Hairline rules retract to center, 0.3s.
2. Field restores: every node tweens to its home position/scale/opacity, 0.9s `power3.inOut`, stagger 0.008 **random order** (`from: 'random'`) — the crowd disperses naturally rather than un-waving.
3. Axis labels return to 0.22 opacity, 0.6s.
4. Ambient drift resumes as each node arrives home.

Escape always steps back exactly one state: pairing → anchored → idle.

---

## 12. Font loading strategy

- 150 families cannot load eagerly. Split requests: **tier 1 immediately** (one Google Fonts CSS call + Fontshare call at mount), **tier 2 at `requestIdleCallback`**, **tier 3 lazily** as the viewport region they occupy first receives pointer movement, plus a background trickle (one batch of 15 every 2s after idle).
- Use `document.fonts.load()` + `FontFaceSet.ready` checks; a node renders only when its face is confirmed (data-honesty rule — no fallback flash, ever).
- `font-display: block` semantics via the check above; specimens request additional weights on demand when a pairing opens (display voice needs its weight range for the `Emphasis` row).
- Google Fonts: single combined `css2` URLs, ≤ 20 families per request. Fontshare: `api.fontshare.com/v2/css?f[]=family@400,500,700`.
- Devanagari subsets load with their families (Google serves unicode-range subsets automatically; do not strip them).

---

## 13. Performance and accessibility

- **SVG, transform-only.** All motion on `transform`/`opacity`. `will-change: transform` on nodes only while animating (add/remove in `onStart`/`onComplete`).
- One `<svg>` layer for lines (below), one HTML absolute-positioned layer for nameplates (above — real text nodes, selectable, inspectable). Lines in SVG, names in DOM: best of both.
- Hit testing via a spatial grid (cell 160px), not 150 individual listeners: one `pointermove` handler on the canvas resolves the nearest node.
- **Keyboard:** Tab focuses the field; arrow keys move focus to the spatially nearest node in that direction; Enter anchors/pairs; Escape steps back. Focused node shows the hover state plus a 1px `--select-ring` outline offset 6px.
- **Screen readers:** each nameplate is a `<button>` with `aria-label="${name}, ${category}, ${specimen}"`. The specimen region is `role="region" aria-label="Type specimen: ${a} paired with ${b}"`. Live region announces state changes ("Fraunces anchored. 5 partners shown.").
- **`prefers-reduced-motion`:** all ambient drift off; every transition becomes a 0.2s opacity crossfade; the hero reorganization becomes a crossfade between the two layouts. Use `gsap.matchMedia()`.
- Target: 60fps with 150 nodes idle on an M1 MacBook Air; Lighthouse a11y ≥ 90.

---

## 14. What is deliberately absent

No minimap. No search-as-you-type overlay (keep the v1 Index button, restyled: top-right, Switzer 11px, opens a two-column list of names each in its own face, click flies the camera-less field focus to that node via the §8.2 arc). No context filter pills — the context-card direction is dead; relationships are now expressed spatially and in the specimen. No tooltips beyond the specified whispers. No sound.
