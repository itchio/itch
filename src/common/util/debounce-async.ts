class CancelError extends Error {
  constructor() {
    super("");
  }

  override toString() {
    return `CancelError: ${this.message}`;
  }
}

// Unlike the fire-and-forget debounce in common/util/rate-limit, this one
// wraps promise-returning functions: superseded calls are cancelled and
// resolve to undefined, only the latest call runs f.

function debounceAsync<Arg1, T>(
  f: (arg1: Arg1) => Promise<T>,
  ms: number
): (arg1: Arg1) => Promise<T>;

function debounceAsync<Arg1, Arg2, T>(
  f: (arg1: Arg1, arg2: Arg2) => Promise<T>,
  ms: number
): (arg1: Arg1, arg2: Arg2) => Promise<T>;

function debounceAsync<T>(f: (...args: any[]) => Promise<T>, ms: number) {
  let rejectOther: ((err: Error) => void) | null;

  return async function (...args: any[]) {
    try {
      if (rejectOther) {
        rejectOther(new CancelError());
        rejectOther = null;
      }
      await new Promise((resolve, reject) => {
        rejectOther = reject;
        setTimeout(resolve, ms);
      });

      const ret = await f(...args);
      rejectOther = null;
      return ret;
    } catch (e) {
      if (e instanceof CancelError) {
      } else {
        throw e;
      }
    }
    return undefined as any;
  };
}

export default debounceAsync;
