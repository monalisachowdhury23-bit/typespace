import { useEffect } from 'react';
import './motion';
import { useFontLoader } from './hooks/useFontLoader';
import { useAppState } from './hooks/useAppState';
import { SpatialMap } from './components/SpatialMap';
import { Specimen } from './components/Specimen';
import './index.css';

export default function App() {
  useFontLoader();
  const { state, selectFont, stepBack, hoverFont } = useAppState();

  // Escape steps back from the map. The specimen handles its own Escape
  // (first press leaves the headline, second closes), so skip it here.
  useEffect(() => {
    if (state.mode === 'paired') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stepBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stepBack, state.mode]);

  return (
    <main style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
      <header className="ts-intro">
        <h1 className="ts-intro__title">Typespace</h1>
        <p className="ts-intro__line">150 typefaces mapped by character. Pick one to see the fonts that pair best with it.</p>
        <ul className="ts-legend" aria-label="Line colours">
          <li><span className="ts-legend__swatch" style={{ background: 'var(--rel-kinship)' }} />Kinship</li>
          <li><span className="ts-legend__swatch" style={{ background: 'var(--rel-contrast)' }} />Contrast</li>
          <li><span className="ts-legend__swatch ts-legend__swatch--dashed" />Dashed: both have Devanagari</li>
        </ul>
      </header>
      <nav className="ts-links" aria-label="About this project">
        <a href="https://monalisachowdhury.vercel.app/">Portfolio <span aria-hidden="true">↗</span></a>
        <a href="https://github.com/monalisachowdhury23-bit/typespace" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
      </nav>

      <SpatialMap
        state={state}
        onSelect={selectFont}
        onHover={hoverFont}
        onBack={stepBack}
      />

      {state.mode === 'paired' && state.anchorId && state.partnerId && (
        <Specimen
          anchorId={state.anchorId}
          partnerId={state.partnerId}
          onEscape={stepBack}
        />
      )}
    </main>
  );
}
