import { describe, expect, test } from 'vitest';
import {
  clampPreviewZoom,
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
  previewZoomFromWheel,
} from './preview-viewport-model';

describe('preview viewport model', () => {
  test('rounds and constrains zoom to the supported range', () => {
    expect(clampPreviewZoom(124.6)).toBe(125);
    expect(clampPreviewZoom(20)).toBe(PREVIEW_ZOOM_MIN);
    expect(clampPreviewZoom(240)).toBe(PREVIEW_ZOOM_MAX);
  });

  test('turns wheel direction into smooth bounded zoom changes', () => {
    expect(previewZoomFromWheel(100, -50)).toBeGreaterThan(100);
    expect(previewZoomFromWheel(100, 50)).toBeLessThan(100);
    expect(previewZoomFromWheel(PREVIEW_ZOOM_MAX, -100)).toBe(PREVIEW_ZOOM_MAX);
    expect(previewZoomFromWheel(PREVIEW_ZOOM_MIN, 100)).toBe(PREVIEW_ZOOM_MIN);
  });
});
