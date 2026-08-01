export function findNewlyOpenedSection(
  currentSections: readonly string[],
  nextSections: readonly string[],
): string | undefined {
  return nextSections.find((section) => !currentSections.includes(section));
}
