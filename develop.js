//@ts-check
"use strict";

const childProcess = require("child_process");
const path = require("path");
const { existsSync } = require("fs");

const weblog = require("webpack-log");
const log = weblog({ name: "develop" });
const chokidar = require("chokidar");
const http = require("http");

const workerPool = require("./gobbler/worker_pool").makeWorkerPool();
const gobbler = require("./gobbler/lib");

async function main() {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "1";

  if (process.env.LOCAL_VALET === "1") {
    log.info(`Attempting to use local version of valet`);
    let bindingsBase = path.resolve("../valet/artifacts");
    if (!existsSync(bindingsBase)) {
      throw new Error(`Local valet build not found at ${bindingsBase}`);
    }
    process.env.VALET_BINDINGS_BASE = bindingsBase;
  }

  process.on("unhandledRejection", (e) => {
    log.error(`Unhandled rejection `, e);
    process.exit(1);
  });
  process.on("uncaughtException", (e) => {
    log.error(`Uncaught exception `, e.stack || e);
    process.exit(1);
  });

  log.info(`Compiling...`);
  await compile();

  if (!process.env.ITCH_LOG_LEVEL) {
    process.env.ITCH_LOG_LEVEL = "debug";
  }

  // in a node context, this gives the path to electron
  /** @type {string} */
  // @ts-ignore
  const electronBinaryPath = require("electron");

  log.info(`Starting app...`);
  let refreshPort = 9021;
  process.env.ITCH_REFRESH_PORT = `${refreshPort}`;
  await new Promise((resolve, reject) => {
    let inspectArg = process.env.ITCH_BREAK === "1" ? "inspect-brk" : "inspect";
    const proc = childProcess.spawn(
      electronBinaryPath,
      [
        ".",
        "--dev",
        `--${inspectArg}=9222`,
        "--color",
        "--no-sandbox" /* on Linux, sandboxing requires a SUID helper and it's a hassle */,
      ],
      {
        env: {
          ...process.env,
        },
        stdio: ["ignore", "inherit", "inherit"],
      }
    );

    proc.on("close", () => {
      log.info(`App closed`);
      resolve();
    });

    proc.on("error", (e) => reject(e));

    let watcher = chokidar.watch("src");
    watcher.once("ready", () => {
      log.info(`Watching for file changes...`);
      watcher.on("all", () => {
        (async () => {
          log.info(`Some sources changed!`);
          await compile();
          notifyChanges(refreshPort);
        })().catch((e) => console.warn("While refreshing", e.stack));
      });
    });
  });
}

/**
 * Notify app of new sources
 * @param {number} port
 */
function notifyChanges(port) {
  try {
    http
      .request({
        host: `localhost`,
        port,
        path: `/`,
        method: "post",
        headers: {
          "content-type": "application/json",
        },
      })
      .on("error", (e) => {
        console.warn("While contacting refresh server: ", e.stack);
      })
      .end(
        JSON.stringify({
          message: "Hello from develop.js",
        })
      );
  } catch (e) {
    log.warn(`Could not notify of changes: `, e.stack);
  }
}

/** Compile sources */
async function compile() {
  await gobbler.build(workerPool, {
    inDir: "src",
    outDir: "lib/development",
    production: false,
  });
}

main();
