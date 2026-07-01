export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 50;

export function clampLimit(
  limit: number | undefined,
  def = DEFAULT_PAGE_SIZE,
  max = MAX_PAGE_SIZE,
): number {
  if (!limit || Number.isNaN(limit)) return def;
  return Math.min(Math.max(1, Math.floor(limit)), max);
}

/**
 * Given a page fetched with `take: limit + 1`, split off the extra row and
 * return the trimmed items plus the next cursor (the id of the last kept row).
 */
export function toPage<T extends { id: string }>(
  rows: T[],
  limit: number,
): { items: T[]; nextCursor: string | null } {
  if (rows.length > limit) {
    const items = rows.slice(0, limit);
    return { items, nextCursor: items[items.length - 1].id };
  }
  return { items: rows, nextCursor: null };
}
