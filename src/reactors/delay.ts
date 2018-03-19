/** returns a promise that resolves after 'ms' milliseconds */
function delay(ms: number) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

export default delay;
