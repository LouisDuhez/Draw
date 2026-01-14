import { create } from 'zustand';

export type Tool = 'pen' | 'eraser';

interface DrawingState {
  tool: Tool;
  color: string;
  strokeWidth: number;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  tool: 'pen',
  color: '#000000',
  strokeWidth: 2,
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
}));