//@ts-check
"use strict";

/**
 * @param {() => void} f
 * @returns {Promise<string>}
 */
async function measure(f) {
  let t1 = Date.now();
  await f();
  let t2 = Date.now();
  return `${(t2 - t1).toFixed()}ms`;
}

module.exports = { measure };
