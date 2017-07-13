/** returns a promise that resolves after 'ms' milliseconds */
export default function delay(ms: number) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}
