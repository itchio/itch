
import * as invariant from "invariant";

const self = function (msBetweenRequests: number) {
  invariant(msBetweenRequests > 0, "cooldown has positive msBetweenRequests");
  let lastRequest = 0;

  return function cooldown (): Promise<void> {
    const now = Date.now();
    const nextAcceptable = lastRequest + msBetweenRequests;
    const quiet = nextAcceptable - now;

    if (now > nextAcceptable) {
      lastRequest = now;
      return Promise.resolve();
    } else {
      lastRequest = nextAcceptable;
    }

    return new Promise<void>((resolve: () => void, reject: () => void) => {
      setTimeout(resolve, quiet);
    });
  };
};

export default self;
