import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { BASE_FONTS } from '../data/fonts';
import { FONT_META, INDIC_FONT_IDS, assignRoles } from '../data/font-meta';

interface Props {
  fontAId: string;
  fontBId: string;
}

interface FontShape {
  id: string;
  name: string;
  category: string;
  specimen: string;
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const eyebrow = (fontName: string, color: string, size = 10): React.CSSProperties => ({
  fontFamily: `'${fontName}', sans-serif`,
  fontSize: size,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color,
  lineHeight: 1,
});

const body = (fontName: string, size = 14, lineHeight = 1.6): React.CSSProperties => ({
  fontFamily: `'${fontName}', sans-serif`,
  fontSize: size,
  color: '#6a6460',
  lineHeight,
  marginTop: 10,
});

const byline = (fontName: string): React.CSSProperties => ({
  fontFamily: `'${fontName}', sans-serif`,
  fontSize: 11,
  color: '#4a4540',
  fontStyle: 'italic',
  marginBottom: 10,
});

const navRow = (fontName: string, color = '#3a3530', size = 11): React.CSSProperties => ({
  fontFamily: `'${fontName}', sans-serif`,
  fontSize: size,
  color,
  letterSpacing: '0.06em',
});

function CuratedBadge({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute', bottom: 10, right: 14,
      fontSize: 8, color, letterSpacing: '0.08em',
      fontFamily: 'system-ui, sans-serif', opacity: 0.55,
    }}>↑ curated pair</div>
  );
}

// ─── Card 1 · Editorial ───────────────────────────────────────────────────────

function EditorialCard({ display, text, curated }: { display: FontShape; text: FontShape; curated: boolean }) {
  return (
    <div style={{
      background: '#121110',
      borderRadius: 0,
      border: '1px solid #1e1b17',
      padding: '24px 26px',
      minHeight: 360,
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 0,
      overflow: 'hidden',
    }}>
      <div style={eyebrow(text.name, '#c9a96e')}>Editorial</div>
      <div style={{ width: '100%', height: 1, background: '#2a2520', margin: '10px 0 18px' }} />

      {/* Drop cap + headline */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{
          fontFamily: `'${display.name}', serif`,
          fontSize: 56,
          lineHeight: 0.9,
          float: 'left',
          marginRight: 7,
          marginTop: 3,
          color: '#f0ede8',
        }}>T</span>
        <div style={{
          fontFamily: `'${display.name}', serif`,
          fontSize: 24, lineHeight: 1.05, color: '#f0ede8',
        }}>
          he Archive Is a Verb
        </div>
      </div>

      <div style={byline(text.name)}>By Amara Osei — 14 min read</div>

      <div style={{ ...body(text.name, 14, 1.6), color: '#6a6460', flex: 1 }}>
        Digital magazines quietly abandoned the front page a decade ago. What replaced it — the feed,
        the push alert, the group chat — never agreed on what a lead story owes its reader.
      </div>

      <div style={{ ...navRow(text.name), marginTop: 14 }}>
        Culture · Opinion · Climate · Fiction
      </div>

      {curated && <CuratedBadge color="#c9a96e" />}
    </div>
  );
}

// ─── Card 2 · Finance ─────────────────────────────────────────────────────────

function FinanceCard({ display, text, curated }: { display: FontShape; text: FontShape; curated: boolean }) {
  return (
    <div style={{
      background: '#0a0a0a',
      borderRadius: 2,
      border: '1px solid #1c2128',
      padding: '20px 22px',
      minHeight: 360,
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 0,
      overflow: 'hidden',
    }}>
      <div style={eyebrow(text.name, '#6ea3c9')}>Finance</div>

      {/* Hero number */}
      <div style={{
        fontFamily: `'${display.name}', serif`,
        fontSize: 34, lineHeight: 1.1, color: '#f0ede8',
        marginTop: 12, marginBottom: 4,
        fontVariantNumeric: 'tabular-nums',
      }}>₹4,82,390.16</div>
      <div style={{
        fontFamily: `'${text.name}', sans-serif`,
        fontSize: 11, color: '#2ea06b', marginBottom: 14, letterSpacing: '0.02em',
      }}>▲ +1.24% today</div>

      <div style={body(text.name, 12, 1.5)}>
        Portfolio rebalanced 2 Jul. Equity allocation drifted 3.1% above target;
        suggested action queued for review.
      </div>

      <div style={{ height: 1, background: '#1c2128', margin: '14px 0' }} />

      {/* Ticker row */}
      <div style={{
        fontFamily: `'${text.name}', sans-serif`,
        fontSize: 10, color: '#4a5060',
        lineHeight: 1.8, letterSpacing: '0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        NIFTY 50 <span style={{ color: '#f0ede8' }}>24,141.95</span>{' '}
        <span style={{ color: '#2ea06b' }}>+0.62%</span>
        {'   '}AAPL <span style={{ color: '#f0ede8' }}>231.04</span>{' '}
        <span style={{ color: '#d05353' }}>−0.31%</span>
        {'   '}BTC <span style={{ color: '#f0ede8' }}>108,240</span>{' '}
        <span style={{ color: '#2ea06b' }}>+2.17%</span>
      </div>

      {/* Column headers */}
      <div style={{ marginTop: 12, flex: 1 }}>
        {['HOLDINGS', 'P&L (1D)', 'XIRR'].map(h => (
          <div key={h} style={{
            fontFamily: `'${text.name}', sans-serif`,
            fontSize: 9, color: '#3a4050',
            borderTop: '1px solid #1c2128',
            padding: '5px 0', letterSpacing: '0.08em',
          }}>{h}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>
        {['Export CSV', 'Set alert'].map(label => (
          <div key={label} style={{
            fontFamily: `'${text.name}', sans-serif`,
            fontSize: 10, color: '#4a5060',
            border: '1px solid #1c2128', borderRadius: 3,
            padding: '4px 10px', letterSpacing: '0.06em',
          }}>{label}</div>
        ))}
      </div>

      {curated && <CuratedBadge color="#6ea3c9" />}
    </div>
  );
}

// ─── Card 3 · Health ──────────────────────────────────────────────────────────

function HealthCard({ display, text, curated }: { display: FontShape; text: FontShape; curated: boolean }) {
  return (
    <div style={{
      background: '#0f0e12',
      backgroundImage: 'radial-gradient(circle at 20% 15%, rgba(180,140,120,0.08) 0%, transparent 60%)',
      borderRadius: 16,
      border: 'none',
      padding: '24px 26px',
      minHeight: 360,
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 0,
      overflow: 'hidden',
    }}>
      <div style={eyebrow(text.name, '#8ec96e')}>Health</div>

      <div style={{
        fontFamily: `'${display.name}', serif`,
        fontSize: 22, lineHeight: 1.25, color: '#f0ede8',
        marginTop: 14, marginBottom: 14,
      }}>
        Slept 7h 42m. Your best week this month.
      </div>

      <div style={{ ...body(text.name, 14, 1.65), flex: 1 }}>
        Heart-rate variability is trending up, which usually follows consistent sleep.
        Tonight's wind-down starts at 10:15.
      </div>

      {/* Metric pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        {['HRV 64 ms', 'Resting HR 58', 'Readiness 82'].map(m => (
          <div key={m} style={{
            fontFamily: `'${text.name}', sans-serif`,
            fontSize: 10, color: '#8ec96e',
            border: '1px solid #2a3820', borderRadius: 20,
            padding: '3px 10px',
          }}>{m}</div>
        ))}
      </div>

      <div style={{ paddingTop: 16 }}>
        <div style={{
          fontFamily: `'${text.name}', sans-serif`,
          fontSize: 12, color: '#0a0a0a',
          background: '#f0ede8', borderRadius: 8,
          padding: '8px 0', textAlign: 'center', letterSpacing: '0.04em',
        }}>Start wind-down</div>
        <div style={{
          fontFamily: `'${text.name}', sans-serif`,
          fontSize: 10, color: '#3a3530',
          textAlign: 'center', marginTop: 10,
        }}>Move goal · 78%</div>
      </div>

      {curated && <CuratedBadge color="#8ec96e" />}
    </div>
  );
}

// ─── Card 4 · Technology ──────────────────────────────────────────────────────

function TechCard({ display, text, curated }: { display: FontShape; text: FontShape; curated: boolean }) {
  return (
    <div style={{
      background: '#080808',
      borderRadius: 8,
      border: '1px solid #1a1218',
      boxShadow: 'inset 0 0 0 1px #B1146820',
      padding: '20px 22px',
      minHeight: 360,
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 0,
      overflow: 'hidden',
    }}>
      {/* Magenta gradient keyline overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(177,20,104,0.18) 0%, transparent 45%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, #B11468, transparent)',
        borderRadius: '8px 8px 0 0',
      }} />

      <div style={{ ...navRow(text.name, '#3a3530', 10), marginBottom: 12 }}>
        Product · Pricing · Docs · Changelog
      </div>

      <div style={eyebrow(text.name, '#9e6ec9')}>Technology</div>

      <div style={{
        fontFamily: `'${display.name}', serif`,
        fontSize: 30, lineHeight: 1.05, color: '#f0ede8',
        marginTop: 10, marginBottom: 12, flex: 1,
      }}>
        Ship the roadmap you actually wrote
      </div>

      <div style={body(text.name, 13, 1.5)}>
        Pipeline automation that reads your repo, not your promises.
        Deploys gated on evidence since 2024.
      </div>

      <div style={{ paddingTop: 16, display: 'flex', gap: 8 }}>
        <div style={{
          fontFamily: `'${text.name}', sans-serif`,
          fontSize: 11, color: '#fff',
          background: '#B11468', borderRadius: 5,
          padding: '7px 14px', letterSpacing: '0.04em',
        }}>Start free trial</div>
        <div style={{
          fontFamily: `'${text.name}', sans-serif`,
          fontSize: 11, color: '#6a6460',
          border: '1px solid #2a2520', borderRadius: 5,
          padding: '7px 14px', letterSpacing: '0.04em',
        }}>Book a demo</div>
      </div>

      <div style={{
        fontFamily: `'${text.name}', sans-serif`,
        fontSize: 10, color: '#3a3530',
        marginTop: 10, letterSpacing: '0.03em',
      }}>12,400+ teams · SOC 2 Type II</div>

      {curated && <CuratedBadge color="#9e6ec9" />}
    </div>
  );
}

// ─── Card 5 · Bilingual (conditional) ────────────────────────────────────────

function BilingualCard({ display, text }: { display: FontShape; text: FontShape }) {
  // Indic font always owns Devanagari, Latin companion runs English
  const indicFont  = INDIC_FONT_IDS.has(display.id) ? display : text;
  const latinFont  = INDIC_FONT_IDS.has(display.id) ? text : display;

  return (
    <div style={{
      background: '#121110',
      borderRadius: 4,
      border: '1px solid #1e1b17',
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
      gridColumn: 'span 2',
    }}>
      <div style={eyebrow(text.name, '#c9a96e')}>बहुभाषी · Bilingual</div>

      <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
        {/* Devanagari side */}
        <div style={{ flex: 1, paddingRight: 20 }}>
          <div style={{
            fontFamily: `'${indicFont.name}', serif`,
            fontSize: 26, lineHeight: 1.4, color: '#f0ede8', marginBottom: 8,
          }}>आपकी रिपोर्ट तैयार है</div>
          <div style={body(indicFont.name, 13, 1.7)}>
            भुगतान 2 जुलाई को संसाधित किया गया।
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <div style={{
              fontFamily: `'${indicFont.name}', serif`,
              fontSize: 11, color: '#6a6460',
              border: '1px solid #2a2520', borderRadius: 4, padding: '4px 10px',
            }}>डाउनलोड करें</div>
          </div>
        </div>

        {/* Hairline divider */}
        <div style={{ width: 1, background: '#2a2520', alignSelf: 'stretch' }} />

        {/* English side */}
        <div style={{ flex: 1, paddingLeft: 20 }}>
          <div style={{
            fontFamily: `'${latinFont.name}', sans-serif`,
            fontSize: 22, lineHeight: 1.3, color: '#f0ede8', marginBottom: 8,
          }}>Your report is ready</div>
          <div style={body(latinFont.name, 13, 1.7)}>
            Processed on 2 July. Statement covers 1 Apr – 30 Jun.
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <div style={{
              fontFamily: `'${latinFont.name}', sans-serif`,
              fontSize: 11, color: '#6a6460',
              border: '1px solid #2a2520', borderRadius: 4, padding: '4px 10px',
            }}>Download</div>
          </div>
          <div style={{
            fontFamily: `'${latinFont.name}', sans-serif`,
            fontSize: 10, color: '#3a3530', marginTop: 10, letterSpacing: '0.05em',
          }}>Toggle: हिंदी | English</div>
        </div>
      </div>

      {/* Typographic correction callouts */}
      <div style={{
        marginTop: 16, borderTop: '1px solid #2a2520', paddingTop: 12,
        display: 'flex', gap: 16, flexWrap: 'wrap',
      }}>
        {[
          'Size +4–6%: Devanagari loop-height ≠ Latin x-height',
          'Weight: Indic Regular ≈ Latin Medium (shirorekha adds density)',
          'Leading: 1.7 mixed-script vs 1.5 Latin-only (matras need room)',
        ].map(note => (
          <div key={note} style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 9, color: '#4a4540',
            letterSpacing: '0.03em', lineHeight: 1.5,
            flex: '1 0 160px',
          }}>{note}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Role assignment tie state + toggle ──────────────────────────────────────

function SwapToggle({ onSwap }: { onSwap: () => void }) {
  return (
    <button onClick={onSwap} style={{
      fontFamily: 'system-ui, sans-serif',
      fontSize: 9, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: '#6a6460',
      background: 'none', border: '1px solid #2a2520',
      borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
      marginLeft: 10,
    }}>⇄ swap roles</button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PairingStage({ fontAId, fontBId }: Props) {
  const fontA = BASE_FONTS.find(f => f.id === fontAId);
  const fontB = BASE_FONTS.find(f => f.id === fontBId);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const hairlineRef = useRef<HTMLDivElement>(null);
  const [rolesSwapped, setRolesSwapped] = useState(false);

  if (!fontA || !fontB) return null;

  const metaA = FONT_META[fontAId];
  const metaB = FONT_META[fontBId];
  const isTie = Math.abs((metaA?.displayAffinity ?? 5) - (metaB?.displayAffinity ?? 5)) <= 1
    && fontA.category === fontB.category;

  const baseRoles = assignRoles(fontAId, fontA.category, fontBId, fontB.category);
  const roles = rolesSwapped
    ? { displayId: baseRoles.textId, textId: baseRoles.displayId }
    : baseRoles;

  const displayFont = roles.displayId === fontAId ? fontA : fontB;
  const textFont    = roles.textId    === fontAId ? fontA : fontB;

  const showBilingual = INDIC_FONT_IDS.has(fontAId) || INDIC_FONT_IDS.has(fontBId);

  const pairing = fontA.pairings.find(p => p.font === fontB.name)
    ?? fontB.pairings.find(p => p.font === fontA.name);

  const hasCurated = (ctx: string) =>
    pairing?.contexts.includes(ctx as never) ?? false;

  const displayShape: FontShape = { id: displayFont.id, name: displayFont.name, category: displayFont.category, specimen: displayFont.specimen };
  const textShape: FontShape    = { id: textFont.id,    name: textFont.name,    category: textFont.category,    specimen: textFont.specimen };

  const roleNote = `${displayFont.name} displays — ${
    displayFont.category === 'serif' && textFont.category !== 'serif'
      ? `${textFont.name}'s monoline runs the text role`
      : `higher display affinity at ${metaA?.displayAffinity ?? '?'} vs ${metaB?.displayAffinity ?? '?'}`
  }`;

  // ── Beat 1: hairline + card materialization ──────────────────────────────
  useEffect(() => {
    setRolesSwapped(false);

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];

    if (hairlineRef.current) {
      gsap.fromTo(hairlineRef.current,
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.4, ease: 'expo.out' }
      );
    }

    // Alternating clip-path wipe direction per card
    cards.forEach((card, i) => {
      const fromClip = i % 2 === 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
      gsap.fromTo(card,
        { clipPath: fromClip, y: 24, opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1,
          duration: 0.55, ease: 'power3.out', delay: 0.35 + i * 0.14 }
      );

      // Content micro-stagger inside card
      const children = Array.from(card.children) as HTMLElement[];
      gsap.fromTo(children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out',
          stagger: 0.055, delay: 0.35 + i * 0.14 + 0.15 }
      );
    });
  }, [fontAId, fontBId]);

  const cards = [
    <EditorialCard key="ed"  display={displayShape} text={textShape} curated={hasCurated('editorial')}  />,
    <FinanceCard   key="fin" display={displayShape} text={textShape} curated={hasCurated('finance')}    />,
    <HealthCard    key="hlt" display={displayShape} text={textShape} curated={hasCurated('health')}     />,
    <TechCard      key="tch" display={displayShape} text={textShape} curated={hasCurated('technology')} />,
    ...(showBilingual
      ? [<BilingualCard key="bil" display={displayShape} text={textShape} />]
      : []),
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 10, pointerEvents: 'none',
      padding: '0 22%',
      overflowY: 'auto',
    }}>
      {/* Pairing lockup + role note */}
      <div style={{ textAlign: 'center', marginBottom: 24, pointerEvents: 'none' }}>
        <div style={{
          fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#2a2520', fontFamily: 'system-ui, sans-serif', marginBottom: 10,
        }}>Pairing</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontFamily: `'${fontA.name}', serif`, fontSize: 20, color: '#f0ede8' }}>
            {fontA.name}
          </span>
          <span style={{ color: '#2a2520', fontFamily: 'system-ui', fontSize: 14 }}>×</span>
          <span style={{ fontFamily: `'${fontB.name}', sans-serif`, fontSize: 20, color: '#f0ede8' }}>
            {fontB.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <div style={{
            fontSize: 9, color: '#3a3530', fontFamily: 'system-ui', fontStyle: 'italic',
          }}>{roleNote}</div>
          {isTie && <SwapToggle onSwap={() => setRolesSwapped(s => !s)} />}
        </div>
      </div>

      {/* Hairline charge */}
      <div ref={hairlineRef} style={{
        width: 1, height: 20, background: '#2a2520',
        marginBottom: 10, transformOrigin: 'top', opacity: 0,
      }} />

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        width: '100%',
        pointerEvents: 'auto',
      }}>
        {cards.map((card, i) => (
          <div
            key={i}
            ref={el => { cardsRef.current[i] = el; }}
            style={{ opacity: 0, overflow: 'hidden' }}
          >
            {card}
          </div>
        ))}
      </div>

      {/* Rationale pull-quote */}
      {pairing && (
        <div style={{
          width: '76%', marginTop: 16,
          fontSize: 10, color: '#3a3530', lineHeight: 1.7,
          fontFamily: 'system-ui', textAlign: 'center', fontStyle: 'italic',
          pointerEvents: 'none',
        }}>
          "{pairing.rationale.length > 140
            ? pairing.rationale.slice(0, 140) + '…'
            : pairing.rationale}"
        </div>
      )}
    </div>
  );
}
