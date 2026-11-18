import { useEffect } from 'react';
import { FONT_UNIVERSE } from '../data/universe';
import type { UniverseFont } from '../data/universe';

// ── Tiered font loading (spec §12) ────────────────────────────────────────────
// Tier 1 → immediate; tier 2 → requestIdleCallback; tier 3 → background trickle.
// Nodes only render once their font is confirmed via document.fonts.load().

function buildGoogleUrl(fonts: UniverseFont[]): string {
  const families = fonts
    .filter(f => f.source === 'google' && f.googleFont)
    .map(f => `family=${f.googleFont!}:ital,wght@0,400;0,500;0,700;1,400`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=block`;
}

function buildFontshareUrl(fonts: UniverseFont[]): string {
  const params = fonts
    .filter(f => f.source === 'fontshare')
    .map(f => `f[]=${f.id}@400,500,700`)
    .join('&');
  return `https://api.fontshare.com/v2/css?${params}&display=block`;
}

function injectLink(href: string, id: string) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// Batch load a list of fonts by appending link tags
function loadBatch(batch: UniverseFont[], suffix: string) {
  const google = batch.filter(f => f.source === 'google' && f.googleFont);
  const fontshare = batch.filter(f => f.source === 'fontshare');

  if (google.length) {
    // Split into max 20 per request
    for (let i = 0; i < google.length; i += 20) {
      injectLink(buildGoogleUrl(google.slice(i, i + 20)), `gf-${suffix}-${i}`);
    }
  }
  if (fontshare.length) {
    injectLink(buildFontshareUrl(fontshare), `fs-${suffix}`);
  }
}

export function useFontLoader() {
  useEffect(() => {
    const tier1 = FONT_UNIVERSE.filter(f => f.tier === 1);
    const tier2 = FONT_UNIVERSE.filter(f => f.tier === 2);
    const tier3 = FONT_UNIVERSE.filter(f => f.tier === 3);

    // Tier 1 — immediate
    loadBatch(tier1, 't1');

    // Tier 2 — idle
    const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    ric(() => loadBatch(tier2, 't2'));

    // Tier 3 — background trickle, 15 fonts every 2s after first idle
    ric(() => {
      let offset = 0;
      const trickle = () => {
        if (offset >= tier3.length) return;
        loadBatch(tier3.slice(offset, offset + 15), `t3-${offset}`);
        offset += 15;
        setTimeout(trickle, 2000);
      };
      setTimeout(trickle, 1000);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ── Confirm a font face is loaded ────────────────────────────────────────────
// Used by SpatialMap to know when to show each node.
export async function awaitFont(fontName: string, size = 16): Promise<boolean> {
  try {
    await document.fonts.load(`${size}px '${fontName}'`);
    return true;
  } catch {
    return false;
  }
}
