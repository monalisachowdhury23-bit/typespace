import { useEffect, useCallback } from 'react';
import { useFontLoader } from './hooks/useFontLoader';
import { useAppState } from './hooks/useAppState';
import { FontField } from './components/FontField';
import { AnchorSlot } from './components/AnchorSlot';
import { PairingStage } from './components/PairingStage';
import './index.css';

export default function App() {
  useFontLoader();
  const { state, selectFont, hoverFont, reset } = useAppState();
  const isPaired = !!(state.fontA && state.fontB);

  // Escape → reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') reset(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reset]);

  const clearA = useCallback(() => {
    selectFont(state.fontA!);
  }, [state.fontA, selectFont]);

  const clearB = useCallback(() => {
    selectFont(state.fontB!);
  }, [state.fontB, selectFont]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a' }}>
      {/* Floating font field — always present, dims when paired */}
      <FontField
        fontA={state.fontA}
        fontB={state.fontB}
        hoveredId={state.hoveredId}
        onSelect={selectFont}
        onHover={hoverFont}
      />

      {/* Left anchor */}
      <AnchorSlot slot="A" fontId={state.fontA} otherFontId={state.fontB} onClear={clearA} />

      {/* Right anchor */}
      <AnchorSlot slot="B" fontId={state.fontB} otherFontId={state.fontA} onClear={clearB} />

      {/* Context cards — center stage, only when paired */}
      {isPaired && (
        <PairingStage fontAId={state.fontA!} fontBId={state.fontB!} />
      )}

      {/* Hint text — before any selection */}
      {!state.fontA && !state.fontB && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#2a2825',
          fontFamily: 'system-ui, sans-serif',
          pointerEvents: 'none',
        }}>
          Click two fonts to explore a pairing
        </div>
      )}
    </div>
  );
}
