import { useState, useCallback } from 'react';

export type AppMode = 'idle' | 'anchored' | 'paired';

export interface AppState {
  mode: AppMode;
  anchorId: string | null;   // first font selected
  partnerId: string | null;  // second font selected (paired state)
  hoveredId: string | null;
}

export function useAppState() {
  const [state, setState] = useState<AppState>({
    mode: 'idle',
    anchorId: null,
    partnerId: null,
    hoveredId: null,
  });

  const selectFont = useCallback((id: string) => {
    setState(s => {
      if (s.mode === 'idle') {
        return { ...s, mode: 'anchored', anchorId: id };
      }
      if (s.mode === 'anchored') {
        if (s.anchorId === id) {
          // Deselect anchor → idle
          return { mode: 'idle', anchorId: null, partnerId: null, hoveredId: s.hoveredId };
        }
        // Second pick → paired
        return { ...s, mode: 'paired', partnerId: id };
      }
      if (s.mode === 'paired') {
        if (s.anchorId === id || s.partnerId === id) {
          // Clicking either paired font → back to idle
          return { mode: 'idle', anchorId: null, partnerId: null, hoveredId: s.hoveredId };
        }
        // Click a periphery font → re-anchor on it
        return { ...s, mode: 'anchored', anchorId: id, partnerId: null };
      }
      return s;
    });
  }, []);

  // Escape steps back one level
  const stepBack = useCallback(() => {
    setState(s => {
      if (s.mode === 'paired')   return { ...s, mode: 'anchored', partnerId: null };
      if (s.mode === 'anchored') return { mode: 'idle', anchorId: null, partnerId: null, hoveredId: s.hoveredId };
      return s;
    });
  }, []);

  const hoverFont = useCallback((id: string | null) => {
    setState(s => s.hoveredId === id ? s : { ...s, hoveredId: id });
  }, []);

  return { state, selectFont, stepBack, hoverFont };
}
