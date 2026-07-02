# Font Pairing Explorer

A spatial map of font pairings. Twenty-five typefaces sit on a dark canvas like a constellation; click one and its curated companions branch out radially, each with a rationale grounded in actual typographic reasoning — x-height relationships, stroke modulation, weight balance, optical size. Built with React, TypeScript, and GSAP on an SVG canvas.

## Why this exists

Existing pairing tools share a flaw: they tell you *what* without *why*. Fontjoy generates pairings from ML embeddings — statistically plausible, unexplainable, and unaccountable when wrong. Fontpair and Pair & Compare show you lists and screenshots: here are two fonts together, decide for yourself. None of them teach. You leave with a pairing but not with judgment.

This tool takes the opposite bet: fewer fonts, every pairing hand-curated, every rationale written to be *argued with*. If a card says a pairing works because the sans's x-height compensates for the serif's small one, you can check that claim. The rationale is the product; the constellation is just an honest way to browse relationships — pairing is a graph, and browsing a graph as a list throws away its structure.

## The Indic fonts

Five of the twenty-five faces — Mukta, Hind, Baloo 2, Eczar, Noto Sans — are dual-script designs carrying Devanagari alongside Latin. This is not a diversity gesture; it's a category of pairing problem Western tools ignore entirely.

Bilingual interfaces are the default condition for products serving half a billion Hindi-English users, and they fail typographically in specific, describable ways: stroke weights that don't match across scripts, Devanagari sized by Latin x-height (wrong — the loop height governs), display fonts whose conjunct clusters clot at headline sizes, and English getting the personality font while the Indic script gets a system default. Each Indic pairing here addresses those mechanics directly — including practical corrections like the ~1.06× up-sizing Hind needs beside a Latin body face, or matching Clash Display to Mukta ExtraBold by apparent blackness rather than nominal weight, because the shirorekha adds density Latin doesn't have.

If a pairing tool claims to be for interface designers in 2026 and can't say anything about scripts other than Latin, it's a tool for a shrinking market.

## Design decisions

**SVG over Canvas 2D.** The nodes are *text*, rendered live in the fonts they represent — that's the whole point. SVG gives real DOM text nodes: crisp at any zoom, selectable, inspectable, and accessible (each node is a focusable element with a name, not pixels in a raster). Canvas would force reimplementing text rendering, hit-testing, and accessibility to gain performance headroom this project doesn't need — 25 nodes plus ~8 satellites is nowhere near SVG's ceiling. Choose the renderer for the content; the content here is type.

**GSAP over CSS transitions.** The expand choreography is a sequenced timeline — world recedes, node asserts, pairings bloom outward with lines leading them — with interruption handling when the user clicks a second font mid-animation. CSS transitions can't express sequencing beyond `transition-delay` arithmetic, and they can't be preempted cleanly: you get whatever intermediate state the browser was in. GSAP timelines are killable, reversible, and time-scalable, which is what "click another node mid-expand" actually requires. The full motion spec lives in [`animation-spec.md`](./animation-spec.md).

**A filter, not a search.** Context tags (editorial, finance, health, technology, education, branding, multilingual) filter the visible pairings; there is no search box. Search implies you know what you're looking for — but the tool's user doesn't, that's why they're here. A filter narrows a visible set without destroying spatial memory: non-matching nodes dim in place rather than disappearing, so the map stays the map. Search over 25 fonts would also be theater. The honest interaction for a small curated set is *lens*, not *query*.

## Stack

- **React 18 + TypeScript** — the pairing data is a typed graph (`font-data.ts`); TypeScript keeps 128 pairings honest
- **Vite** — dev server and build
- **GSAP 3** — all motion; timelines for expand/collapse choreography
- **Google Fonts** — 20 of 25 families, loaded on demand per selection
- **Fontshare** — Satoshi, Cabinet Grotesk, General Sans, Switzer, Clash Display

Fonts load lazily: the idle canvas loads only the 25 base specimens (subset to the specimen strings); a font's pairing companions load on click. Nobody pays for 60 font files to look at a landing state.

## Run it

```bash
git clone <repo-url>
cd font-pairing-explorer
npm install
npm run dev
```

Vite serves on `http://localhost:5173`. No environment variables, no backend — the pairing data ships as a static TypeScript module.

```bash
npm run build && npm run preview   # production build
```

## Curation criteria

Every font earned its place against four tests:

1. **Contemporary relevance** — faces working designers actually reach for now. No Roboto, no Open Sans, no Lato; defaults teach nothing.
2. **Distinct voice** — each font must be distinguishable from every other node at specimen size. Two near-identical grotesques waste a slot.
3. **Pairing fertility** — a font needed at least five defensible pairings within the set. Beautiful loners were cut.
4. **Free to use** — everything loads from Google Fonts or Fontshare, so any pairing you find here you can ship today.

Pairing rationales were written one at a time, against rendered specimens, and revised where the claim didn't survive looking at the actual letterforms. Where a rationale names a number — an x-height ratio, a size compensation — it's meant to be checked.
