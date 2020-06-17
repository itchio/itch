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
 *   reactRefresh: boolean,
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
          if (!job) {
            return;
          }

          let result = await babel.transformFileAsync(job.input, {
            sourceMaps: "inline",
          });
          if (result && result.code) {
            await mkdir(dirname(job.output), { recursive: true });
            let code = result.code;
            if (job.reactRefresh && job.input.includes("renderer/")) {
              code = `
var prevRefreshReg = window.$RefreshReg$;
var prevRefreshSig = window.$RefreshSig$;
var RefreshRuntime = require('react-refresh/runtime');

window.$RefreshReg$ = (type, id) => {
  // Note module.id is webpack-specific, this may vary in other bundlers
  const fullId = module.id + ' ' + id;
  console.debug("Registering module/type", fullId);
  RefreshRuntime.register(type, fullId);
}
window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;

try {
  ${code}
} finally {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
              `;
            }
            await writeFile(job.output, code, { encoding: "utf-8" });
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
