import fastMemoize from "fast-memoize";
import LRU from "lru-cache";

export function memoize<T>(limit: number, f: T): T {
  return fastMemoize(f, {
    cache: {
      create: () => new LRU(limit),
    },
  });
}
