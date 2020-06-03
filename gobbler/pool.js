//@ts-check
"use strict";

let debug = require("debug")("gobbler:pool");

/**
 * @typedef Pool
 * @type {{
 *   state: PoolState,
 *   schedule: (f: () => Promise<void>) => void,
 *   promise: () => Promise<void>,
 * }}
 */

/**
 * @typedef PoolState
 * @type {{
 *   promises: Promise<void>[],
 *   backlog: (() => Promise<void>)[],
 *   jobs: number,
 * }}
 */

/**
 * @param {{ jobs: number }} opts
 * @returns {Pool}
 */
function makePool(opts) {
  /** @type {PoolState} */
  let state = {
    promises: [],
    backlog: [],
    jobs: opts.jobs,
  };

  let backlogPop = () => {
    let next = state.backlog.pop();
    if (next) {
      debug("Popped from backlog...");
      return next();
    } else {
      debug("Nothing in backlog");
      return;
    }
  };

  /** @type {Pool} */
  let pool = {
    state,
    schedule: (f) => {
      if (state.promises.length < state.jobs) {
        state.promises.push(f().then(backlogPop));
      } else {
        debug("Pushing to backlog...");
        state.backlog.push(() => {
          return f().then(backlogPop);
        });
      }
    },
    promise: async () => {
      await Promise.all(state.promises);
    },
  };
  return pool;
}

module.exports = { makePool };
