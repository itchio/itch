// tslint:disable:no-console

let interactive = false;

function exit (exitCode) {
  if (interactive) {
    app.exit(exitCode);
    return;
  }
  console.log(`this is the magic exit code: ${exitCode}`);
}

process.on("uncaughtException", (e: Error) => {
  console.log("Uncaught exception: ", e.stack);
  exit(127);
});

process.on("unhandledRejection", (reason: string, p: Promise<any>) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  exit(129);
});

require("source-map-support").install({
  hookRequire: true,
});
const bluebird = require("bluebird");
bluebird.config({
  longStackTraces: true,
});

import env from "../env";
env.name = "test";
process.env.NODE_ENV = "test";

const chalk = require("chalk");

const {app} = require("electron");
const {extname} = require("path").posix;
const {resolve} = require("path");

app.on("ready", async () => {
  const {BrowserWindow} = require("electron");
  const win = new BrowserWindow({
    backgroundColor: "#ff8080",
  });
  win.setTitle("Running tests...");
  win.setMenuBarVisibility(false);
  win.setContentSize(210, 210);
  win.center();
  win.loadURL("about:blank");

  const glob = require("bluebird").promisify(require("glob"));
  const cwd = resolve(__dirname, "..");
  console.log(`looking for tests in ${cwd}`);
  let testFiles = await glob("**/*[\.-]spec.ts", {cwd});

  const args = process.argv.slice(2);
  let state = 0;
  for (const arg of args) {
    if (state === 2) {
      testFiles = [arg.replace(/.*src\/unit-tests\//, "")];
      console.log(`Unit test runner only running ${JSON.stringify(testFiles)}`);
      break;
    } else if (state === 1) {
      if (arg === "--test" || arg === "-t") {
        state = 2;
      }
    } else {
      if (arg === "--run-unit-tests") {
        state = 1;
      }
      if (arg === "--interactive") {
        interactive = true;
      }
    }
  }

  const tape = require("tape");

  if (interactive) {
    const faucet = require("faucet");
    tape.createStream().pipe(faucet()).pipe(process.stdout);
  }

  tape.onFinish((a, b, c) => {
    const harness = tape.getHarness();
    harness._results.close();
    win.setTitle(`Exit code = ${harness._exitCode}`);
    exit(harness._exitCode);
  });

  console.log(chalk.blue(`loading ${testFiles.length} test suites`));

  for (const testFile of testFiles) {
    const ext = extname(testFile);
    const extless = testFile.slice(0, -(ext.length));
    const requirePath = `../${extless}`;
    require(requirePath);
  }
});
