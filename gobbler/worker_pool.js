//@ts-check
"use strict";

const { join } = require("path");
const { Worker, SHARE_ENV } = require("worker_threads");
const chalk = require("chalk");
const os = require("os");

/**
 * @typedef NodeWorker
 * @type import("worker_threads").Worker
 */

/**
 * @typedef WorkerPool
 * @type {{
 *   state: {
 *     workers: NodeWorker[],
 *     dead: boolean,
 *   },
 *   terminate(): void,
 *   getWorkersForJobs(numJobs: number): NodeWorker[],
 * }}
 */

/**
 * @returns WorkerPool
 */
function makeWorkerPool() {
  /** @type {WorkerPool["state"]} */
  let state = {
    workers: [],
    dead: false,
  };

  // Always start with one worker
  state.workers.push(makeWorker());

  /** @type {WorkerPool} */
  let pool = {
    state,
    terminate: () => {
      state.dead = true;
      for (const worker of state.workers) {
        worker.terminate();
      }
      state.workers = [];
    },
    getWorkersForJobs: (numJobs) => {
      let concurrency = os.cpus().length;
      let numWorkers = Math.min(numJobs, concurrency);
      console.log(`Using ${chalk.yellow(numWorkers)} workers`);
      while (state.workers.length < numWorkers) {
        state.workers.push(makeWorker());
      }
      return state.workers;
    },
  };
  return pool;
}

/**
 * @returns {NodeWorker}
 */
function makeWorker() {
  return new Worker(join(__dirname, "worker.js"), {
    // @ts-ignore
    env: SHARE_ENV,
  });
}

module.exports = { makeWorkerPool };
