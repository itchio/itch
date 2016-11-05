
import * as ExtendableError from "es6-error";

const chatty = process.env.IAMA_JELLO_AMA === "1";

// tslint:disable:no-console

export class CancelError extends ExtendableError {
  constructor () {
    super("");
  }

  toString () {
    return `CancelError: ${this.message}`;
  }
}

export default function debounce (ms: number) {
  let f = this;
  let rejectOther: (err: Error) => void;

  return async function () {
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

      const fp = f.apply(null, arguments);
      const ret = await fp;
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
