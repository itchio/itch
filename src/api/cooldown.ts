
import * as bluebird from "bluebird";

interface ITimeFuncs {
  getTime: () => number;
  delay: (ms: number) => Promise<void>;
}

const defaultTimeFuncs: ITimeFuncs =  {
  getTime: () => Date.now(),
  delay: async (ms: number) => { await bluebird.delay(ms); },
};

export default function (msBetweenRequests: number, funcs = defaultTimeFuncs) {
  if (msBetweenRequests <= 0) {
    throw new Error("cooldown must have strictly positive msBetweenRequests");
  }
  let lastRequest = 0;

  return async function cooldown (): Promise<void> {
    const now = funcs.getTime();
    const nextAcceptable = lastRequest + msBetweenRequests;
    const quietPeriod = nextAcceptable - now;

    if (now > nextAcceptable) {
      lastRequest = now;
      return;
    } else {
      lastRequest = nextAcceptable;
    }

    await funcs.delay(quietPeriod);
  };
};
