const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const [mainConfig, rendererConfig] = require("./webpack.config.dev.js");
const childProcess = require("child_process");

const weblog = require("webpack-log");
const log = weblog({ name: "develop" });

async function main() {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "1";

  process.on("unhandledRejection", e => {
    log.error(`Unhandled rejection `, e.stack || e);
    process.exit(1);
  });
  process.on("uncaughtException", e => {
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

  await ensureButler();

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

    proc.on("error", e => reject(e));
  });
}

// TODO: re-use logic for `release/` scripts, for
// integration tests, etc.
// Maybe have it as a small Go utility?
async function ensureButler() {
  if (process.env.LOCAL_BUTLER === "1") {
    console.log(`Using local butler, so, not downloading...`);
    return;
  }

  await new Promise((resolve, reject) => {
    childProcess.exec(
      "go run ./install-deps --manifest package.json --dir . --development",
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

main();
