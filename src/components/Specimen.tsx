import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { FONT_UNIVERSE } from '../data/universe';
import type { UniverseFont } from '../data/universe';
import { rationaleSentence, annotationCopy, relType, REL_COLORS } from '../data/compat';

// ── Fixed content pool (spec §10.2) ──────────────────────────────────────────
const LOCKUPS = [
  { kicker: 'FIELD NOTES · TYPE',   headline: 'Letters carry weather',  deck: 'Every typeface arrives with a climate of its own — the pairing decides the season.' },
  { kicker: 'SPECIMEN NO. 4',       headline: 'Two voices, one page',   deck: 'A headline speaks; a paragraph listens. Good pairs argue in private and agree in public.' },
  { kicker: 'ON CONTRAST',          headline: 'Friction makes the fit', deck: 'The strongest pairings share a skeleton and disagree about everything else.' },
  { kicker: 'THE READING ROOM',     headline: 'Built to disappear',     deck: 'Display type earns the glance. Text type earns the hour. This page needs both.' },
  { kicker: 'PRESSED & PROOFED',    headline: 'Ink remembers the hand', deck: 'Before the pixel there was the pen, and both of these faces know it.' },
];

// Deterministic hash for lockup selection
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// ── Role assignment (spec §10) ────────────────────────────────────────────────
function assignRoles(
  anchorFont: UniverseFont,
  partnerFont: UniverseFont,
): { display: UniverseFont; text: UniverseFont } {
  if (anchorFont.displayAffinity >= partnerFont.displayAffinity) {
    return { display: anchorFont, text: partnerFont };
  }
  return { display: partnerFont, text: anchorFont };
}

// ── Structure phrase from annotationCopy ──────────────────────────────────────
function structurePhrase(a: UniverseFont, b: UniverseFont): string {
  const parts = annotationCopy(a, b).split(' · ');
  return parts[1] ?? '';
}

const RUNNING_PARAGRAPH = `"The paragraph is where a typeface stops performing and starts working. At this size nobody admires letterforms; they fall through them into meaning. Count the fonts that survive this — the honest x-height, the even color, the rhythm that never once asks to be noticed."`;

interface Props {
  anchorId: string;
  partnerId: string;
  onEscape: () => void;
}

export function Specimen({ anchorId, partnerId, onEscape }: Props) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const ruleTopRef   = useRef<HTMLDivElement>(null);
  const ruleBotRef   = useRef<HTMLDivElement>(null);
  const kickerRef    = useRef<HTMLDivElement>(null);
  const headlineRef  = useRef<HTMLDivElement>(null);
  const deckRef      = useRef<HTMLDivElement>(null);
  const bandBRef     = useRef<HTMLDivElement>(null);
  const footerRef    = useRef<HTMLDivElement>(null);

  const [rolesSwapped, setRolesSwapped] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState(true);

  const anchorFont  = FONT_UNIVERSE.find(f => f.id === anchorId)!;
  const partnerFont = FONT_UNIVERSE.find(f => f.id === partnerId)!;
  if (!anchorFont || !partnerFont) return null;

  const { display, text } = rolesSwapped
    ? { display: partnerFont.displayAffinity >= anchorFont.displayAffinity ? anchorFont : partnerFont,
        text:    partnerFont.displayAffinity >= anchorFont.displayAffinity ? partnerFont : anchorFont }
    : assignRoles(anchorFont, partnerFont);

  const lockupIdx = hashStr(anchorId + partnerId) % 5;
  const lockup    = LOCKUPS[lockupIdx];
  const rt        = relType(display, text);
  const color     = REL_COLORS[rt];
  const dHG       = Math.abs(display.humanistGeometric - text.humanistGeometric);

  const isIndic = display.indic || text.indic;

  // ── Entrance choreography (spec §10.5) ────────────────────────────────────
  useEffect(() => {
    if (!wrapRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // t=0: hairline rules draw from center
      tl.fromTo([ruleTopRef.current, ruleBotRef.current],
        { scaleX: 0 },
        { scaleX: 1, duration: 0.5, ease: 'power2.out', stagger: 0 },
        0);

      // t=0.15: kicker
      tl.fromTo(kickerRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0,  duration: 0.4, ease: 'power2.out' },
        0.15);

      // t=0.25: headline words (per-word clip reveal)
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.headline-word');
        tl.fromTo(words,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power4.out', stagger: 0.06 },
          0.25);
      }

      // t=0.55: deck
      tl.fromTo(deckRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        0.55);

      // t=0.7: anatomy bands
      tl.fromTo(bandBRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0,  duration: 0.6, ease: 'power3.out' },
        0.7);

      // t=1.1: footer
      tl.fromTo(footerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' },
        1.1);

      // After animation settles, focus headline with cursor at end
      tl.call(() => {
        const el = headlineRef.current;
        if (!el) return;
        el.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false); // false = end
        sel?.removeAllRanges();
        sel?.addRange(range);
      }, [], 1.6);
    }, wrapRef);

    return () => ctx.revert();
  }, [anchorId, partnerId, rolesSwapped]);

  // ── Escape key ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingHeadline && headlineRef.current) {
          headlineRef.current.blur();
          setEditingHeadline(false);
        } else {
          onEscape();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape, editingHeadline]);

  const headlineWords = (isIndic ? 'टाइप बोलता है' : lockup.headline).split(' ');

  const handleSwap = useCallback(() => setRolesSwapped(r => !r), []);

  return (
    <div
      ref={wrapRef}
      className="specimen-overlay"
      style={{ background: 'var(--bg)' }}
      role="region"
      aria-label={`Type specimen: ${display.name} paired with ${text.name}`}
    >
      {/* Fixed exit button — top-left, always reachable */}
      <button
        onClick={onEscape}
        aria-label="Exit specimen, return to font map"
        style={{
          position: 'fixed',
          top: 24,
          left: 32,
          fontFamily: 'var(--font-ui)',
          fontSize: 11,
          color: 'var(--ink)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: '1px solid var(--hairline)',
          padding: '9px 16px',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 10,
          opacity: 0.75,
        }}
      >
        ← Back
      </button>

      {/* Top hairline rule */}
      <div ref={ruleTopRef} style={{
        position: 'absolute', top: 0, left: '6vw', right: '6vw',
        height: 1, background: 'var(--hairline)',
        transformOrigin: 'center', transform: 'scaleX(0)',
      }} />

      {/* ── BAND 1 · COMPOSED LINE ────────────────────────────────────────── */}
      <div style={{
        height: '38vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '80px 6vw 0', overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        {/* Kicker */}
        <div ref={kickerRef} style={{
          fontFamily: `'${text.name}', sans-serif`,
          fontSize: 11, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--ink-dim)',
          marginBottom: 16, opacity: 0,
        }}>
          {lockup.kicker}
        </div>

        {/* Headline — contenteditable, per-word clip */}
        <div
          ref={headlineRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => setEditingHeadline(true)}
          onBlur={() => setEditingHeadline(false)}
          style={{
            fontFamily: `'${display.name}', serif`,
            fontSize: 'clamp(64px, 9vw, 128px)',
            color: 'var(--ink)', lineHeight: 1.02,
            marginBottom: 20, outline: 'none',
            cursor: 'text', position: 'relative',
          }}
        >
          {headlineWords.map((word, i) => (
            <span
              key={i}
              className="headline-word"
              style={{
                display: 'inline-block', overflow: 'hidden',
                marginRight: i < headlineWords.length - 1 ? '0.25em' : 0,
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Deck */}
        <div ref={deckRef} style={{
          fontFamily: `'${text.name}', serif`,
          fontSize: 18, lineHeight: 1.5,
          color: 'var(--ink-dim)', maxWidth: '52ch', opacity: 0,
        }}>
          {isIndic
            ? 'दो लिपियाँ, एक आवाज़ — two scripts, one voice.'
            : lockup.deck}
        </div>
      </div>

      {/* ── BAND 2 · ANATOMY COLUMNS ──────────────────────────────────────── */}
      <div ref={bandBRef} style={{
        height: '44vh', display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr',
        padding: '0 6vw', opacity: 0,
      }}>
        {/* Display column */}
        <div style={{ paddingRight: '3vw', overflow: 'hidden', paddingTop: 24 }}>
          {/* Alphabet waterfall */}
          {isIndic ? (
            <>
              <div style={{ fontFamily: `'${display.name}', serif`, fontSize: 40, color: 'var(--ink)', lineHeight: 1.2 }}>
                क ख ग घ ङ च छ ज झ ञ
              </div>
              <div style={{ fontFamily: `'${display.name}', serif`, fontSize: 40, color: 'var(--ink)', lineHeight: 1.2 }}>
                ट ठ ड ढ ण त थ द ध न
              </div>
              <div style={{ fontFamily: `'${display.name}', serif`, fontSize: 40, color: 'var(--ink)', lineHeight: 1.2 }}>
                प फ ब भ म य र ल व श ष स ह
              </div>
              <div style={{ fontFamily: `'${display.name}', serif`, fontSize: 30, color: 'var(--ink-dim)', lineHeight: 1.4, marginTop: 8 }}>
                का कि की कु कू के कै को कौ कं कः
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: `'${display.name}', serif`, fontSize: 40, color: 'var(--ink)', lineHeight: 1.2 }}>
                ABCDEFGHIJKLM
              </div>
              <div style={{ fontFamily: `'${display.name}', serif`, fontSize: 40, color: 'var(--ink)', lineHeight: 1.2 }}>
                NOPQRSTUVWXYZ
              </div>
              <div style={{ fontFamily: `'${display.name}', serif`, fontSize: 30, color: 'var(--ink)', lineHeight: 1.4 }}>
                abcdefghijklmnopqrstuvwxyz
              </div>
              <div style={{ fontFamily: `'${display.name}', serif`, fontSize: 30, color: 'var(--ink-dim)', lineHeight: 1.4 }}>
                0123456789 !?&%@·—
              </div>
            </>
          )}
          {/* Emphasis weight row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {[300, 400, 500, 700, 900].map(wt => (
              <span key={wt} style={{
                fontFamily: `'${display.name}', serif`,
                fontWeight: wt, fontSize: 26,
                color: 'var(--ink)',
              }}>Emphasis</span>
            ))}
          </div>
        </div>

        {/* Hairline divider + annotation chips */}
        <div style={{ position: 'relative', background: 'var(--hairline)' }}>
          {/* X-height overlay chip at 25% */}
          <ChipWithOverlay
            top="25%"
            display={display}
            text={text}
            color={color}
            label={isIndic ? 'shirorekha meets baseline' : 'x-height, same point size'}
            glyphA={isIndic ? 'क' : 'x'}
            glyphB={isIndic ? 'k' : 'x'}
            colorA="var(--rel-contrast)"
            colorB="var(--rel-kinship)"
          />
          {/* Structure chip at 50% */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-ui)', fontSize: 10,
            letterSpacing: '0.06em', color, whiteSpace: 'normal',
            textAlign: 'center', maxWidth: 'calc(6vw - 12px)',
            background: '#0a0a0a', padding: '2px 6px',
          }}>
            {structurePhrase(display, text)}
          </div>
          {/* Weight chip at 75% */}
          <div style={{
            position: 'absolute', top: '75%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-ui)', fontSize: 10,
            letterSpacing: '0.06em', color, whiteSpace: 'normal',
            textAlign: 'center', maxWidth: 'calc(6vw - 12px)',
            background: '#0a0a0a', padding: '2px 6px',
          }}>
            weight {display.visualWeight} against {text.visualWeight}
          </div>
        </div>

        {/* Text column */}
        <div style={{ paddingLeft: '3vw', overflow: 'hidden', paddingTop: 24 }}>
          {/* Running paragraph */}
          <div style={{
            fontFamily: `'${text.name}', serif`,
            fontSize: 15, lineHeight: 1.6,
            color: 'rgba(236,233,228,0.85)', maxWidth: '44ch',
          }}>
            {isIndic && text.indic && (
              <span>अनुच्छेद वह जगह है जहाँ टाइपफ़ेस प्रदर्शन बंद कर काम शुरू करता है। </span>
            )}
            {RUNNING_PARAGRAPH}
          </div>

          {/* UI fragment */}
          <div style={{ marginTop: 20, borderTop: '1px solid var(--hairline)', paddingTop: 16 }}>
            <div style={{ fontFamily: `'${text.name}', serif`, fontSize: 13, color: 'var(--ink-dim)', marginBottom: 6 }}>
              Account balance
            </div>
            <div style={{ fontFamily: `'${text.name}', serif`, fontSize: 22, color: 'var(--ink)' }}>
              ₹ 48,206.19
            </div>
          </div>

          {/* Tabular numerals */}
          <div style={{
            fontFamily: `'${text.name}', serif`,
            fontSize: 14, color: 'var(--ink-dim)', marginTop: 16,
            fontFeatureSettings: '"tnum"',
          }}>
            1,024 · 99.4% · 08:15:42
          </div>
        </div>
      </div>

      {/* ── BAND 3 · RATIONALE FOOTER ─────────────────────────────────────── */}
      <div ref={footerRef} style={{
        height: '18vh', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6vw', opacity: 0,
      }}>
        {/* Left — generated sentence */}
        <div style={{
          fontFamily: `'${text.name}', serif`,
          fontSize: 16, lineHeight: 1.5, color: 'var(--ink)',
          maxWidth: '52ch',
        }}>
          {rationaleSentence(display, text)}
        </div>

        {/* Right — controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
          {/* Swap roles — prominent styled button */}
          <button
            onClick={handleSwap}
            aria-label="Swap display and text font roles"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              color: 'var(--ink-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: '1px solid rgba(236,233,228,0.12)',
              padding: '10px 20px',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: 0.6,
            }}
          >
            <span style={{ fontSize: 16 }}>⇄</span> Swap roles
          </button>

          {/* Tension meter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--ink-ghost)' }}>kin</span>
            <div style={{ position: 'relative', width: 120, height: 1, background: 'var(--hairline)' }}>
              <div style={{
                position: 'absolute',
                left: `${Math.min(dHG / 2, 1) * 100}%`,
                top: '50%', transform: 'translate(-50%, -50%)',
                width: 4, height: 4, borderRadius: '50%',
                background: color,
              }} />
            </div>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: 'var(--ink-ghost)' }}>tension</span>
          </div>
        </div>
      </div>

      {/* Bottom hairline rule */}
      <div ref={ruleBotRef} style={{
        position: 'absolute', bottom: 0, left: '6vw', right: '6vw',
        height: 1, background: 'var(--hairline)',
        transformOrigin: 'center', transform: 'scaleX(0)',
      }} />
    </div>
  );
}

// ── X-height / shirorekha overlay chip ─────────────────────────────────────────
function ChipWithOverlay({
  top, display, text, color, label, glyphA, glyphB, colorA, colorB,
}: {
  top: string;
  display: UniverseFont;
  text: UniverseFont;
  color: string;
  label: string;
  glyphA: string;
  glyphB: string;
  colorA: string;
  colorB: string;
}) {
  return (
    <div style={{
      position: 'absolute', top, left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      {/* Superimposed glyphs */}
      <div style={{ position: 'relative', height: 64, width: 64 }}>
        <div style={{
          position: 'absolute', inset: 0,
          fontFamily: `'${display.name}', serif`,
          fontSize: 64, lineHeight: 1,
          color: colorA, opacity: 0.45,
          mixBlendMode: 'screen',
        }}>{glyphA}</div>
        <div style={{
          position: 'absolute', inset: 0,
          fontFamily: `'${text.name}', serif`,
          fontSize: 64, lineHeight: 1,
          color: colorB, opacity: 0.45,
          mixBlendMode: 'screen',
        }}>{glyphB}</div>
      </div>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 10,
        letterSpacing: '0.06em', color, whiteSpace: 'normal',
        textAlign: 'center', maxWidth: 'calc(6vw - 12px)',
        background: '#0a0a0a', padding: '2px 6px',
      }}>
        {label}
      </div>
    </div>
  );
}
