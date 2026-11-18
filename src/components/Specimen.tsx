import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { FONT_UNIVERSE } from '../data/universe';
import type { UniverseFont } from '../data/universe';
import { rationaleSentence, annotationCopy, relType, REL_COLORS, bothDevanagari } from '../data/compat';

// ── Fixed content pool ────────────────────────────────────────────────────────
const LOCKUPS = [
  { kicker: 'Field notes · Type',   headline: 'Letters carry weather',  deck: 'Every typeface arrives with a climate of its own; the pairing decides the season.' },
  { kicker: 'Specimen no. 4',       headline: 'Two voices, one page',   deck: 'A headline speaks; a paragraph listens. Good pairs argue in private and agree in public.' },
  { kicker: 'On contrast',          headline: 'Friction makes the fit', deck: 'The strongest pairings share a skeleton and disagree about everything else.' },
  { kicker: 'The reading room',     headline: 'Built to disappear',     deck: 'Display type earns the glance. Text type earns the hour. This page needs both.' },
  { kicker: 'Pressed & proofed',    headline: 'Ink remembers the hand', deck: 'Before the pixel there was the pen, and both of these faces know it.' },
];

const HINDI_HEADLINE = 'टाइप बोलता है';
const HINDI_DECK = 'दो लिपियाँ, एक आवाज़।';
const HINDI_PARAGRAPH = 'अनुच्छेद वह जगह है जहाँ टाइपफ़ेस प्रदर्शन बंद कर काम शुरू करता है। ';
const DEVA_ROWS = ['क ख ग घ ङ च छ ज झ ञ', 'ट ठ ड ढ ण त थ द ध न', 'प फ ब भ म य र ल व श ष स ह'];
const DEVA_MATRAS = 'का कि की कु कू के कै को कौ कं कः';

const RUNNING_PARAGRAPH = `The paragraph is where a typeface stops performing and starts working. At this size nobody admires letterforms; they fall through them into meaning. Count the fonts that survive this: the honest x-height, the even color, the rhythm that never once asks to be noticed.`;

const WEIGHTS: { wt: number; name: string }[] = [
  { wt: 400, name: 'Regular' },
  { wt: 500, name: 'Medium' },
  { wt: 700, name: 'Bold' },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// The more expressive face leads; Swap roles flips it, even for equal faces.
function assignRoles(a: UniverseFont, b: UniverseFont, swapped: boolean) {
  const aLeads = a.displayAffinity >= b.displayAffinity;
  const display = aLeads !== swapped ? a : b;
  const text = display === a ? b : a;
  return { display, text };
}

function structurePhrase(a: UniverseFont, b: UniverseFont): string {
  const p = annotationCopy(a, b).split(' · ')[1] ?? '';
  return p.charAt(0).toUpperCase() + p.slice(1);
}

const ff = (f: UniverseFont, fallback = 'serif') => `'${f.name}', ${fallback}`;

interface Props {
  anchorId: string;
  partnerId: string;
  onEscape: () => void;
}

export function Specimen({ anchorId, partnerId, onEscape }: Props) {
  const wrapRef     = useRef<HTMLDivElement>(null);
  const backRef     = useRef<HTMLButtonElement>(null);
  const ruleRef     = useRef<HTMLDivElement>(null);
  const kickerRef   = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const deckRef     = useRef<HTMLDivElement>(null);
  const bandBRef    = useRef<HTMLDivElement>(null);
  const footerRef   = useRef<HTMLDivElement>(null);

  const [rolesSwapped, setRolesSwapped] = useState(false);

  const anchorFont  = FONT_UNIVERSE.find(f => f.id === anchorId);
  const partnerFont = FONT_UNIVERSE.find(f => f.id === partnerId);

  // ── Entrance choreography ─────────────────────────────────────────────────
  useEffect(() => {
    if (!wrapRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(ruleRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power2.out' }, 0);
      tl.fromTo(kickerRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.15);
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.headline-word > span');
        tl.fromTo(words,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.7, ease: 'power4.out', stagger: 0.06 },
          0.25);
      }
      tl.fromTo(deckRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.55);
      tl.fromTo(bandBRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.7);
      tl.fromTo(footerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 1.0);
    }, wrapRef);
    return () => ctx.revert();
  }, [anchorId, partnerId, rolesSwapped]);

  // Move focus into the dialog when it opens
  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
    wrapRef.current?.scrollTo({ top: 0 });
  }, [anchorId, partnerId]);

  // ── Escape: first stops editing the headline, then closes ─────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.activeElement === headlineRef.current) {
        headlineRef.current?.blur();
        backRef.current?.focus({ preventScroll: true });
      } else {
        onEscape();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape]);

  const handleSwap = useCallback(() => setRolesSwapped(r => !r), []);

  if (!anchorFont || !partnerFont) return null;

  const { display, text } = assignRoles(anchorFont, partnerFont, rolesSwapped);
  const lockup = LOCKUPS[hashStr(anchorId + partnerId) % LOCKUPS.length];
  const rt     = relType(display, text);
  const color  = REL_COLORS[rt];
  const dHG    = Math.abs(display.humanistGeometric - text.humanistGeometric);
  const tension = Math.min(dHG / 2, 1);

  // Devanagari is only ever set in a face that actually has it
  const headlineHindi = display.indic;
  const headline = headlineHindi ? HINDI_HEADLINE : lockup.headline;
  const words = headline.split(' ');

  let overlay: { a: string; b: string; label: string };
  if (display.indic && text.indic) overlay = { a: 'क', b: 'क', label: 'Devanagari at the same point size' };
  else if (display.indic || text.indic) overlay = { a: display.indic ? 'क' : 'k', b: text.indic ? 'क' : 'k', label: 'Headline stroke against the Latin x-height' };
  else overlay = { a: 'x', b: 'x', label: 'x-height at the same point size' };

  const titleId = 'specimen-title';

  return (
    <div
      ref={wrapRef}
      className="specimen-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sp-topbar">
        <button ref={backRef} className="ts-btn" onClick={onEscape} aria-label="Back to suggested partners">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M12 7H2M6 3L2 7l4 4" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
          Back
        </button>
        <h2 id={titleId} className="sp-pairname">
          {display.name} <span aria-hidden="true">+</span><span className="sr-only">with</span> {text.name}
        </h2>
      </div>
      <div ref={ruleRef} className="sp-rule" aria-hidden="true" />

      {/* ── Band 1 · composed line ─────────────────────────────────────── */}
      <section className="sp-band1" aria-label="Composed headline">
        <div ref={kickerRef} className="sp-kicker" style={{ fontFamily: ff(text, 'sans-serif') }}>
          {lockup.kicker}
        </div>

        <div
          key={headline}
          ref={headlineRef}
          className="sp-headline"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="Headline, editable. Type to try your own words."
          lang={headlineHindi ? 'hi' : undefined}
          spellCheck={false}
          style={{ fontFamily: ff(display) }}
        >
          {words.map((word, i) => (
            <span key={`${word}-${i}`}>
              <span className="headline-word"><span>{word}</span></span>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </div>

        <div ref={deckRef} className="sp-deck">
          {text.indic ? (
            <>
              <span lang="hi" style={{ fontFamily: ff(text) }}>{HINDI_DECK}</span>{' '}
              <span style={{ fontFamily: ff(text) }}>Two scripts, one voice.</span>
            </>
          ) : (
            <span style={{ fontFamily: ff(text) }}>{headlineHindi ? 'Two scripts, one voice.' : lockup.deck}</span>
          )}
          <p className="sp-hint">Click the headline to type your own words.</p>
        </div>
      </section>

      {/* ── Band 2 · anatomy ───────────────────────────────────────────── */}
      <section ref={bandBRef} className="sp-band2" aria-label="Anatomy">
        {/* Display column */}
        <div className="sp-col">
          <div className="sp-label">{display.name} · display</div>
          {display.indic ? (
            <div lang="hi" style={{ fontFamily: ff(display) }}>
              {DEVA_ROWS.map(r => <div key={r} className="sp-alpha">{r}</div>)}
              <div className="sp-alpha sp-alpha--sm sp-dim">{DEVA_MATRAS}</div>
            </div>
          ) : (
            <div style={{ fontFamily: ff(display) }}>
              <div className="sp-alpha">ABCDEFGHIJKLM</div>
              <div className="sp-alpha">NOPQRSTUVWXYZ</div>
              <div className="sp-alpha sp-alpha--sm">abcdefghijklmnopqrstuvwxyz</div>
              <div className="sp-alpha sp-alpha--sm sp-dim">0123456789 !?&amp;%@</div>
            </div>
          )}
          <div className="sp-weights">
            {WEIGHTS.map(({ wt, name }) => (
              <div key={wt}>
                <div style={{ fontFamily: ff(display), fontWeight: wt, fontSize: 26, fontSynthesis: 'none' }}>Emphasis</div>
                <div className="sp-caption">{name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle notes */}
        <div className="sp-notes">
          <figure className="sp-note">
            <div className="sp-overlay" aria-hidden="true">
              <span style={{ fontFamily: ff(display), color: 'var(--rel-contrast)' }}>{overlay.a}</span>
              <span style={{ fontFamily: ff(text), color: 'var(--rel-kinship)' }}>{overlay.b}</span>
            </div>
            <figcaption style={{ color }}>{overlay.label}</figcaption>
          </figure>
          <p className="sp-note" style={{ color }}>{structurePhrase(display, text)}</p>
          <p className="sp-note" style={{ color }}>Weight {display.visualWeight} against {text.visualWeight}</p>
          {bothDevanagari(display, text) && <p className="sp-note" style={{ color }}>Both have Devanagari</p>}
        </div>

        {/* Text column */}
        <div className="sp-col">
          <div className="sp-label">{text.name} · text</div>
          <p className="sp-para" style={{ fontFamily: ff(text) }}>
            {text.indic && <span lang="hi">{HINDI_PARAGRAPH}</span>}
            {RUNNING_PARAGRAPH}
          </p>
          <div className="sp-ui" style={{ fontFamily: ff(text) }}>
            <div className="sp-ui__label">Account balance</div>
            <div className="sp-ui__value">₹ 48,206.19</div>
            <div className="sp-ui__figs">1,024 · 99.4% · 08:15:42</div>
          </div>
        </div>
      </section>

      {/* ── Band 3 · rationale ─────────────────────────────────────────── */}
      <section ref={footerRef} className="sp-footer" aria-label="Why this pair works">
        <p className="sp-rationale" style={{ fontFamily: ff(text) }}>
          {rationaleSentence(display, text)}
        </p>
        <div className="sp-controls">
          <button className="ts-btn ts-btn--primary" onClick={handleSwap}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5h11M10 2l3 3-3 3M14 11H3M6 8l-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            Swap roles
          </button>
          <div className="sp-meter" role="img" aria-label={`Tension ${Math.round(tension * 100)} percent, from kin to tension`}>
            <span aria-hidden="true">Kin</span>
            <div className="sp-meter__track" aria-hidden="true">
              <div className="sp-meter__dot" style={{ left: `${tension * 100}%`, background: color }} />
            </div>
            <span aria-hidden="true">Tension</span>
          </div>
        </div>
      </section>
    </div>
  );
}
