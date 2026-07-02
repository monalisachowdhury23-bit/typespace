import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { BASE_FONTS } from '../data/fonts';
import { FONT_META } from '../data/font-meta';

interface Props {
  fontId: string | null;
  otherFontId?: string | null;  // used to label metadata in the other anchor's font
  slot: 'A' | 'B';
  onClear: () => void;
}

export function AnchorSlot({ fontId, otherFontId, slot, onClear }: Props) {
  const glyphRef    = useRef<HTMLDivElement>(null);
  const contentRef  = useRef<HTMLDivElement>(null);

  const font      = BASE_FONTS.find(f => f.id === fontId)      ?? null;
  const otherFont = BASE_FONTS.find(f => f.id === otherFontId) ?? null;
  const meta      = fontId ? FONT_META[fontId] : null;

  const isLeft  = slot === 'A';
  const side    = isLeft ? 'left' : 'right';

  // Entrance animation (settle into anchor)
  useEffect(() => {
    if (!font || !contentRef.current) return;
    gsap.fromTo(contentRef.current,
      { opacity: 0, x: isLeft ? -24 : 24 },
      { opacity: 1, x: 0, duration: 0.65, ease: 'expo.out' }
    );
  }, [fontId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Signature glyph breathing loop
  useEffect(() => {
    if (!glyphRef.current || !font) return;
    const tween = gsap.to(glyphRef.current, {
      opacity: 0.1,
      duration: 7,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    return () => { tween.kill(); };
  }, [fontId]);

  const weightsLabel = (id: string) => {
    // Rough "N weights" label per font
    const map: Record<string, string> = {
      'playfair-display': '9 weights · variable',
      'fraunces': '9 weights · variable · optical',
      'cormorant-garamond': '6 weights · italic',
      'instrument-serif': '2 styles',
      'dm-serif-display': '2 styles',
      'libre-baskerville': '3 weights',
      'dm-sans': '9 weights · variable',
      'space-grotesk': '5 weights',
      'plus-jakarta-sans': '8 weights · variable',
      'epilogue': '9 weights · variable',
      'sora': '8 weights',
      'lexend': '9 weights · variable',
      'chivo': '8 weights',
      'outfit': '9 weights · variable',
      'satoshi': '5 weights + italics',
      'cabinet-grotesk': '7 weights',
      'general-sans': '5 weights',
      'switzer': '9 weights',
      'clash-display': '5 weights',
      'bricolage-grotesque': '6 weights · variable',
      'eczar': '5 weights',
      'mukta': '7 weights',
      'hind': '5 weights',
      'baloo-2': '5 weights · variable',
      'noto-sans': '9 weights · variable',
    };
    return map[id] ?? '—';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, bottom: 0,
      [side]: 0,
      width: '22%',
      overflow: 'hidden',
      pointerEvents: fontId ? 'auto' : 'none',
      zIndex: 20,
    }}>
      {font && meta ? (
        <>
          {/* ── 38vh signature glyph bleeding off outer edge ── */}
          <div
            ref={glyphRef}
            style={{
              position: 'absolute',
              top: '50%',
              [isLeft ? 'left' : 'right']: '-10%',
              transform: 'translateY(-50%)',
              fontFamily: `'${font.name}', serif`,
              fontSize: '38vh',
              fontWeight: 600,
              color: '#f0ede8',
              opacity: 0.08,
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {meta.signatureGlyph}
          </div>

          {/* ── Vertical specimen on outer edge ── */}
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0,
            [isLeft ? 'left' : 'right']: 14,
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontFamily: `'${font.name}', serif`,
              fontSize: 12,
              color: '#f0ede8',
              opacity: 0.45,
              letterSpacing: '0.08em',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: isLeft ? 'rotate(180deg)' : 'none',
              userSelect: 'none',
            }}>
              {font.specimen}
            </div>
          </div>

          {/* ── Content panel ── */}
          <div
            ref={contentRef}
            style={{
              position: 'absolute',
              top: 0, bottom: 0,
              [isLeft ? 'left' : 'right']: 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: isLeft ? '0 28px 0 44px' : '0 44px 0 28px',
              textAlign: isLeft ? 'left' : 'right',
            }}
          >
            {/* Slot label */}
            <div style={{
              fontSize: 9, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#3a3530',
              marginBottom: 14, fontFamily: 'system-ui, sans-serif',
            }}>Font {slot}</div>

            {/* Font name in its own typeface */}
            <div style={{
              fontFamily: `'${font.name}', serif`,
              fontSize: 26, color: '#f0ede8', lineHeight: 1.1,
              marginBottom: 8,
            }}>
              {font.name}
            </div>

            {/* Metadata row — rendered in the OTHER anchor's font */}
            <div style={{
              fontFamily: otherFont ? `'${otherFont.name}', sans-serif` : 'system-ui, sans-serif',
              fontSize: 10, color: '#5a5450',
              letterSpacing: '0.04em', marginBottom: 18,
              lineHeight: 1.5,
            }}>
              {font.category} · {weightsLabel(font.id)}
            </div>

            {/* Category badge */}
            <div style={{
              display: 'inline-block',
              alignSelf: isLeft ? 'flex-start' : 'flex-end',
              fontSize: 9, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#6a6460',
              border: '1px solid #2a2825', borderRadius: 12,
              padding: '3px 10px', marginBottom: 22,
              fontFamily: 'system-ui, sans-serif',
            }}>{font.category}</div>

            {/* Remove */}
            <button
              onClick={onClear}
              style={{
                background: 'none', border: 'none', color: '#3a3530',
                fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif', padding: 0,
                alignSelf: isLeft ? 'flex-start' : 'flex-end',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = '#f0ede8'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = '#3a3530'; }}
            >Remove ×</button>
          </div>
        </>
      ) : (
        /* Empty slot hint */
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          [isLeft ? 'left' : 'right']: 40,
          fontSize: 10, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#2a2825',
          fontFamily: 'system-ui, sans-serif',
          textAlign: isLeft ? 'left' : 'right',
        }}>
          Pick font {slot}
        </div>
      )}
    </div>
  );
}
