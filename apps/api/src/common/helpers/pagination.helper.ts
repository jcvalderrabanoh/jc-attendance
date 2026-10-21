export const PAGINATION_DEFAULT_LIMIT = 25;
export const PAGINATION_MAX_LIMIT = 200;

export function normalizePagination(page?: number, limit?: number): { page: number; limit: number; skip: number } {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, Number(limit) || PAGINATION_DEFAULT_LIMIT));
  return { page: p, limit: l, skip: (p - 1) * l };
}
