import fastMemoize = require("fast-memoize");
import LRU = require("lru-cache");

export default function memoize<T>(limit: number, f: T): T {
  return fastMemoize(f, {
    cache: {
      create: () => LRU(limit),
    },
  });
}
