import { useState, useCallback } from 'react';
import type { CanvasState, ContextLabel } from '../types';

export function useCanvasState() {
  const [state, setState] = useState<CanvasState>({
    selectedFontId: null,
    hoveredNodeId: null,
    activeContext: null,
  });

  const selectFont = useCallback((id: string | null) => {
    setState(s => ({ ...s, selectedFontId: id, activeContext: null }));
  }, []);

  const hoverNode = useCallback((id: string | null) => {
    setState(s => ({ ...s, hoveredNodeId: id }));
  }, []);

  const setContext = useCallback((ctx: ContextLabel | null) => {
    setState(s => ({ ...s, activeContext: ctx }));
  }, []);

  return { state, selectFont, hoverNode, setContext };
}
