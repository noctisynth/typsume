import { create } from 'zustand';

export const PREVIEW_ZOOM_MIN = 50;
export const PREVIEW_ZOOM_MAX = 200;
export const PREVIEW_ZOOM_STEP = 10;

export function clampPreviewZoom(value: number) {
  return Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, Math.round(value)));
}

export function previewZoomFromWheel(current: number, deltaY: number, deltaMode = 0) {
  const sensitivity = deltaMode === 1 ? 0.04 : deltaMode === 2 ? 0.4 : 0.002;
  return clampPreviewZoom(current * Math.exp(-deltaY * sensitivity));
}

type PreviewViewportState = {
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomByWheel: (deltaY: number, deltaMode?: number) => void;
};

export const usePreviewViewportModel = create<PreviewViewportState>((set) => ({
  zoom: 100,
  setZoom: (zoom) => set({ zoom: clampPreviewZoom(zoom) }),
  zoomIn: () => set((state) => ({ zoom: clampPreviewZoom(state.zoom + PREVIEW_ZOOM_STEP) })),
  zoomOut: () => set((state) => ({ zoom: clampPreviewZoom(state.zoom - PREVIEW_ZOOM_STEP) })),
  zoomByWheel: (deltaY, deltaMode) =>
    set((state) => ({ zoom: previewZoomFromWheel(state.zoom, deltaY, deltaMode) })),
}));
