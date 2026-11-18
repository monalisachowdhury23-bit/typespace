import { useEffect } from 'react';
import { useFontLoader } from './hooks/useFontLoader';
import { useAppState } from './hooks/useAppState';
import { SpatialMap } from './components/SpatialMap';
import { Specimen } from './components/Specimen';
import './index.css';

export default function App() {
  useFontLoader();
  const { state, selectFont, stepBack, hoverFont } = useAppState();

  // Escape → step back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stepBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stepBack]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
      {/* The spatial font universe — always present */}
      <SpatialMap
        state={state}
        onSelect={selectFont}
        onHover={hoverFont}
      />

      {/* Full-bleed specimen — only when paired */}
      {state.mode === 'paired' && state.anchorId && state.partnerId && (
        <Specimen
          anchorId={state.anchorId}
          partnerId={state.partnerId}
          onEscape={stepBack}
        />
      )}
    </div>
  );
}
