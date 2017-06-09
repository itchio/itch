// tslint:disable:no-console

function exit (exitCode) {
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
const {join} = require("path");

app.on("ready", async () => {
  const {BrowserWindow} = require("electron");
  const win = new BrowserWindow({});
  win.setTitle("Running tests...");
  win.loadURL("about:blank");

  const glob = require("bluebird").promisify(require("glob"));
  const cwd = join(__dirname, "unit-tests");
  console.log(`looking for tests in ${cwd}`);
  let testFiles = await glob("**/*-spec.ts", {cwd});

  const tape = require("tape");

  tape.onFinish((a, b, c) => {
    const harness = tape.getHarness();
    harness._results.close();
    win.setTitle(`Exit code = ${harness._exitCode}`);
    exit(harness._exitCode);
  });

  const args = process.argv.slice(2);
  let state = 0;
  for (const arg of args) {
    if (state === 2) {
      testFiles = [arg.replace(/.*src\/tests\/unit-tests\//, "")];
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
    }
  }

  console.log(chalk.blue(`loading ${testFiles.length} test suites`));

  for (const testFile of testFiles) {
    const ext = extname(testFile);
    const extless = testFile.slice(0, -(ext.length));
    const requirePath = `./unit-tests/${extless}`;
    require(requirePath);
  }
});
