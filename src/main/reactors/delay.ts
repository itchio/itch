/** returns a promise that resolves after 'ms' milliseconds */
export function delay(ms: number) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}
