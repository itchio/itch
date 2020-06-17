//@ts-check
"use strict";

const chalk = require("chalk");
const { measure } = require("./measure");
const { makeWorkerPool } = require("./worker_pool");
const { build } = require("./lib");

/**
 * @param {string[]} args
 */
async function main(args) {
  let elapsed = await measure(async () => {
    await doMain(args);
  });
  console.log(`Total run time: ${chalk.blue(elapsed)}`);
}

/**
 * @param {string[]} args
 */
async function doMain(args) {
  /**
   * @type {import("./lib").Opts}
   */
  let opts = {
    inDir: "src",
    outDir: "unset",
    production: false,
  };

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg === "--clean") {
      opts.clean = true;
    } else if (arg === "--production") {
      opts.production = true;
    } else {
      throw new Error(`Unknown arg ${chalk.yellow(arg)}`);
    }
  }

  if (opts.outDir === "unset") {
    let envName = opts.production ? "production" : "development";
    opts.outDir = `lib/${envName}`;
  }

  let workerPool = makeWorkerPool();
  await build(workerPool, opts);
  workerPool.terminate();
}

main(process.argv.slice(2));

process.on("uncaughtException", (e) => {
  console.warn(`Uncaught exception `, e);
  process.exit(1);
});

process.on("unhandledRejection", (e) => {
  console.warn(`Unhandled rejection`, e);
  process.exit(1);
});
