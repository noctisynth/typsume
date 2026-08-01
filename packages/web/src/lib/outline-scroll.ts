export function calculateContainedScrollTop(
  currentScrollTop: number,
  viewportTop: number,
  targetTop: number,
): number {
  return currentScrollTop + targetTop - viewportTop;
}
