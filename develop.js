
const serve = require("webpack-serve");
const webpack = require("webpack");
const [mainConfig, rendererConfig] = require("./webpack.config.js")({mode: "development"});
const childProcess = require("child_process");
const WebpackServeWaitpage = require("webpack-serve-waitpage")

const weblog = require("webpack-log");
const log = weblog({name: "develop"});

// I am way too angry to comment on this at the moment
process.env.WHC_TARGET = "electron-renderer";

async function main() {
  process.on("unhandledRejection", (e) => {
    log.error(`Unhandled rejection `, e.stack || e);
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
  })

  const server = await serve({
    config: rendererConfig,
    add: (app, middleware, options) => {
      app.use(WebpackServeWaitpage(options, {
        title: "almost there...",
        theme: "material"
      }));
      middleware.webpack();
      middleware.content();
    },
  });
  let portPromise = new Promise((resolve, reject) => {
    server.on("listening", ({server, options}) => {
      log.info("Renderer listening...");
      resolve(options.port);
    })
  })

  log.info(`Main building...`);
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
    log.info(`Main built!`);
  }

  const electronBinaryPath = require("electron")
  log.info(`Will start app with ${electronBinaryPath}`);
  const port = await portPromise;
  log.info(`...off content on localhost:${port}`);

  await new Promise((resolve, reject) => {
    let inspectArg = process.env.ITCH_BREAK === "1" ? "inspect-brk" : "inspect";
    const proc = childProcess.spawn(electronBinaryPath, [
      ".", `--${inspectArg}=9222`, "--color"
    ], {
      env: {
        ...process.env,
        ELECTRON_WEBPACK_WDS_PORT: port,
      },
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    log.info(`Should've started the app now...`);

    proc.on("close", () => {
      log.info(`App closed`);
      server.close();
      resolve();
    })

    proc.on("error", (e) => reject(e))
  });
}

main();
