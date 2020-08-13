
const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const [mainConfig, rendererConfig] = require("./webpack.config.js")(null, {mode: "development"});
const childProcess = require("child_process");

const weblog = require("webpack-log");
const log = weblog({name: "develop"});

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
  });

  rendererConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  const devServerOptions = Object.assign({}, rendererConfig.devServer, {
    stats: {
      colors: true,
    }
  });
  WebpackDevServer.addDevServerEntrypoints(rendererConfig, devServerOptions);

  const rendererCompiler = webpack(rendererConfig);
  const server = new WebpackDevServer(rendererCompiler, devServerOptions);
  const serverPromise = new Promise((resolve, reject) => {
    let port = 9000;
    try {
      server.listen(port, "127.0.0.1", resolve(port));
    } catch (e) {
      reject(e);
    }
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

  log.info(`Renderer building...`)

  const electronBinaryPath = require("electron")
  log.info(`Will start app with ${electronBinaryPath}`);
  const port = await serverPromise;
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
