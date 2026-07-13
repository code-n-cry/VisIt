const SLOT_COUNT = 8;

/**
 * Maps a category to a fixed color slot by its stable position in the
 * categories array (creation order) — never by sort rank — so a category's
 * color never changes as amounts move it around in a sorted chart.
 */
export function categorySlot(categoryId: string, orderedIds: string[]): number {
  const index = orderedIds.indexOf(categoryId);
  const safe = index === -1 ? 0 : index;
  return (safe % SLOT_COUNT) + 1;
}

export function categoryColorVar(categoryId: string, orderedIds: string[]): string {
  return `var(--series-${categorySlot(categoryId, orderedIds)})`;
}
