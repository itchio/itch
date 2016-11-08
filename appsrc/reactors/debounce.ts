
const chatty = process.env.IAMA_JELLO_AMA === "1";

// tslint:disable:no-console

export class CancelError extends Error {
  constructor () {
    super("");
  }

  toString () {
    return `CancelError: ${this.message}`;
  }
}

export default function debounce<T> (f: (...args: any[]) => Promise<T>, ms: number) {
  let rejectOther: (err: Error) => void;

  return async function (...args: any[]) {
    if (chatty) {
      console.log(`launching ${f}`);
    }

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
      if (chatty) {
        console.log(`not cancelled! ${f}`);
      }
      return ret;
    } catch (e) {
      if (e instanceof CancelError) {
        if (chatty) {
          console.log(`cancelled: ${f}`);
        }
      } else {
        throw e;
      }
    }
  };
}
