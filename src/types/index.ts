import type { PairingContext, FontCategory, BaseFont, Pairing } from '../data/fonts';

export type ContextLabel = PairingContext;
export type { FontCategory, BaseFont, Pairing };

// Which font slot: left anchor or right anchor
export type Slot = 'A' | 'B';

export interface AppState {
  fontA: string | null;   // font id in left anchor
  fontB: string | null;   // font id in right anchor
  lastSlot: Slot;         // which slot was filled last (for swap logic)
  hoveredId: string | null;
}

// Legacy — kept for any remaining canvas state refs
export interface CanvasState {
  selectedFontId: string | null;
  hoveredNodeId: string | null;
  activeContext: ContextLabel | null;
}
