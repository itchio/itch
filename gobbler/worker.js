//@ts-check
"use strict";

const babel = require("@babel/core");
const { measure } = require("./measure");

const worker = require("worker_threads");
const { dirname } = require("path");
const { writeFile, mkdir } = require("fs").promises;

/** @type {import("worker_threads").MessagePort} */
// @ts-ignore
const parentPort = worker.parentPort;

/**
 * @typedef WorkerIncomingMessage
 * @type {{
 *   job?: Job,
 * }}
 */

/**
 * @typedef WorkerOutgoingMessage
 * @type {{
 *   kind: "done" | "error" | "debug",
 *   debugArgs?: [any, ...any[]],
 *   error?: string,
 * }}
 */

/**
 * @typedef Job
 * @type {{
 *   input: string,
 *   output: string,
 * }}
 */

/**
 * @type {(...args: any[]) => void}
 */
function debug() {
  let debugArgs = [];
  for (let i = 0; i < arguments.length; i++) {
    debugArgs.push(arguments[i]);
  }

  /** @type {WorkerOutgoingMessage} */
  let msg = {
    kind: "debug",
    // @ts-ignore
    debugArgs,
  };
  parentPort.postMessage(msg);
}

if (parentPort) {
  parentPort.on("message", async (payload) => {
    /** @type {WorkerIncomingMessage} */
    let message = payload;
    let { job } = message;

    if (job) {
      try {
        let elapsed = await measure(async () => {
          // @ts-ignore
          let { input, output } = job;
          let result = await babel.transformFileAsync(input);
          if (result && result.code) {
            await mkdir(dirname(output), { recursive: true });
            await writeFile(output, result.code, { encoding: "utf-8" });
          }
        });
        debug("%o done in %o", job.input, elapsed);

        /** @type {WorkerOutgoingMessage} */
        let outMessage = { kind: "done" };
        parentPort.postMessage(outMessage);
      } catch (e) {
        /** @type {WorkerOutgoingMessage} */
        let outMessage = { kind: "error", error: e.stack || `${e}` };
        parentPort.postMessage(outMessage);
      }
    }
  });
}
