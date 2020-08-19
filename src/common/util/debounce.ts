class CancelError extends Error {
  constructor() {
    super("");
  }

  toString() {
    return `CancelError: ${this.message}`;
  }
}

function debounce<Arg1, T>(
  f: (arg1: Arg1) => Promise<T>,
  ms: number
): (arg1: Arg1) => Promise<T>;

function debounce<Arg1, Arg2, T>(
  f: (arg1: Arg1, arg2: Arg2) => Promise<T>,
  ms: number
): (arg1: Arg1, arg2: Arg2) => Promise<T>;

function debounce<T>(f: (...args: any[]) => Promise<T>, ms: number) {
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

export default debounce;
