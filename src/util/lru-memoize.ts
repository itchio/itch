import fastMemoize from "fast-memoize";
import LRU from "lru-cache";

function memoize<T>(limit: number, f: T): T {
  return fastMemoize(f, {
    cache: {
      create: () => LRU(limit),
    },
  });
}

export default memoize;
