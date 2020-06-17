//@ts-check
"use strict";

const babel = require("@babel/core");
const template = require("@babel/template").default;
const generate = require("@babel/generator").default;
const { measure } = require("./measure");

const worker = require("worker_threads");
const { dirname } = require("path");
const { writeFile, mkdir, readFile } = require("fs").promises;

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
  let refreshTemplate = template.statements(`
      var prevRefreshReg = window.$RefreshReg$;
      var prevRefreshSig = window.$RefreshSig$;
      var RefreshRuntime = require('react-refresh/runtime');

      window.$RefreshReg$ = (type, id) => {
        const fullId = module.id + ' ' + id;
        RefreshRuntime.register(type, fullId);
      }
      window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;

      try {
        %%module%%
      } finally {
        window.$RefreshReg$ = prevRefreshReg;
        window.$RefreshSig$ = prevRefreshSig;
      }
  `);

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

          let inputCode = await readFile(job.input, { encoding: "utf-8" });
          let result = await babel.transformAsync(inputCode, {
            filename: job.input,
            ast: true,
            code: false,
          });
          if (result && result.ast) {
            let ast = result.ast;
            if (job.reactRefresh && /.tsx$/.test(job.input)) {
              ast.program.body = refreshTemplate({
                module: ast.program.body,
              });
            }

            let astResult = generate(
              ast,
              { sourceMaps: true, sourceFileName: job.input },
              inputCode
            );
            let code = astResult.code;

            let sourceMapComment = require("convert-source-map")
              .fromObject(astResult.map)
              .toComment();
            code = `${code}\n${sourceMapComment}`;

            await mkdir(dirname(job.output), { recursive: true });
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
