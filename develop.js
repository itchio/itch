//@ts-check
"use strict";

const childProcess = require("child_process");
const path = require("path");
const { existsSync } = require("fs");

const weblog = require("webpack-log");
const log = weblog({ name: "develop" });

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
  await run("node", ["gobbler"]);

  // in a node context, this gives the path to electron
  /** @type {string} */
  // @ts-ignore
  const electronBinaryPath = require("electron");

  log.info(`Starting app...`);
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
  });
}

/**
 *
 * @param {string} command
 * @param {string[]} args
 * @param {import("child_process").SpawnOptions} [options]
 */
async function run(command, args, options) {
  if (!options) {
    options = {};
  }

  if (!options.stdio) {
    options = {
      ...options,
      stdio: "inherit",
    };
  }
  options.shell = true;

  log.info(`$ ${command} :: ${args.join(" :: ")}`);
  let p = childProcess.spawn(command, args, options);
  await new Promise((resolve, reject) => {
    p.on("close", (code) => {
      if (code != 0) {
        reject(new Error(`${command} exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

main();
