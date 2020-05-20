//@ts-check
"use strict";

const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const [mainConfig, rendererConfig] = require("./webpack.config.dev.js");
const childProcess = require("child_process");
const path = require("path");
const { existsSync } = require("original-fs");

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

  const mainPromise = new Promise((resolve, reject) => {
    webpack(mainConfig, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });

  rendererConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  const devServerOptions = Object.assign({}, rendererConfig.devServer, {
    sockHost: "localhost",
    sockPort: "9000",
    noInfo: true,
  });
  WebpackDevServer.addDevServerEntrypoints(rendererConfig, devServerOptions);

  const rendererCompiler = webpack(rendererConfig);
  // webpack-dev-server doesn't like our `webpack.Compiler` apparently?
  // @ts-ignore
  const server = new WebpackDevServer(rendererCompiler, devServerOptions);
  const serverPromise = new Promise((resolve, reject) => {
    let port = 9000;
    try {
      server.listen(port, "127.0.0.1", resolve(port));
    } catch (e) {
      log.warn(`Looks like the dev server failed to start`);
      log.warn(
        `If something's already listening on port ${port} - is it another copy of the app?`
      );
      log.warn(`node.js instances on Windows tend to not exit cleanly`);
      log.warn(`so don't be afraid to try "taskkill /F /IM node.exe"`);
      reject(e);
    }
  });

  log.info(`Compiling...`);
  const stats = await mainPromise;
  {
    const info = stats.toJson();
    if (stats.hasErrors()) {
      log.error("Main: ", info.errors.join("\n\n"));
      process.exit(1);
    }
    if (stats.hasWarnings()) {
      log.warn("Main: ", info.warnings.join("\n\n"));
    }
  }

  // in a node context, this gives the path to electron
  /** @type {string} */
  // @ts-ignore
  const electronBinaryPath = require("electron");
  const port = await serverPromise;

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
          ELECTRON_WEBPACK_WDS_PORT: port,
        },
        stdio: ["ignore", "inherit", "inherit"],
      }
    );

    proc.on("close", () => {
      log.info(`App closed`);
      server.close();
      resolve();
    });

    proc.on("error", (e) => reject(e));
  });
}

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
