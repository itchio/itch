import { ItchPromise } from "common/util/itch-promise";

/** returns a promise that resolves after 'ms' milliseconds */
export function delay(ms: number) {
  return new ItchPromise((resolve, reject) => setTimeout(resolve, ms));
}
