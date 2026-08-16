interface Record {
  id: string | number;
}

/**
 * Given:
 *   [{id: 1, gameId: 10}, {id: 2, gameId: 20}]
 * This will give:
 *   {"1": {id: 1, gameId: 10}, "2": {id: 2, gameId: 20}}
 *
 * Tolerates null/undefined input: butlerd list results are null when empty.
 */
function indexById<T extends Record>(
  records: T[] | null | undefined
): { [id: string]: T } {
  return Object.fromEntries((records ?? []).map((r) => [r.id, r] as const));
}

export default indexById;
