import { useState, useCallback } from 'react';
import type { AppState, Slot } from '../types';

export function useAppState() {
  const [state, setState] = useState<AppState>({
    fontA: null,
    fontB: null,
    lastSlot: 'A',
    hoveredId: null,
  });

  const selectFont = useCallback((id: string) => {
    setState(s => {
      // Already anchored — deselect
      if (s.fontA === id) return { ...s, fontA: null, lastSlot: 'B' };
      if (s.fontB === id) return { ...s, fontB: null, lastSlot: 'A' };

      // Fill empty slot first
      if (!s.fontA) return { ...s, fontA: id, lastSlot: 'A' };
      if (!s.fontB) return { ...s, fontB: id, lastSlot: 'B' };

      // Both slots filled — replace the slot filled longest ago
      const replaceSlot: Slot = s.lastSlot === 'A' ? 'B' : 'A';
      return replaceSlot === 'A'
        ? { ...s, fontA: id, lastSlot: 'A' }
        : { ...s, fontB: id, lastSlot: 'B' };
    });
  }, []);

  const hoverFont = useCallback((id: string | null) => {
    setState(s => ({ ...s, hoveredId: id }));
  }, []);

  const reset = useCallback(() => {
    setState({ fontA: null, fontB: null, lastSlot: 'A', hoveredId: null });
  }, []);

  const isPaired = !!(state.fontA && state.fontB);

  return { state, selectFont, hoverFont, reset, isPaired };
}
