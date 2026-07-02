export type ContextLabel =
  | 'editorial'
  | 'finance'
  | 'health'
  | 'technology'
  | 'education'
  | 'branding'
  | 'multilingual';

export type FontCategory = 'serif' | 'sans-serif' | 'monospace';

export interface Pairing {
  font: string;
  googleFont: string;
  contexts: ContextLabel[];
  rationale: string;
}

export interface BaseFont {
  id: string;
  name: string;
  category: FontCategory;
  googleFont: string;
  specimen: string;
  position: { x: number; y: number };
  pairings: Pairing[];
}

export interface CanvasState {
  selectedFontId: string | null;
  hoveredNodeId: string | null;
  activeContext: ContextLabel | null;
}
