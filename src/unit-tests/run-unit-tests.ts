// tslint:disable:no-console

function exit (exitCode) {
  if (process.env.ITCH_DONT_EXIT === "1") {
    console.log(`Should exit with code ${exitCode}, but asked not to`);
    return;
  } else {
    app.exit(exitCode);
  }
}

process.on("uncaughtException", (e: Error) => {
  console.log("Uncaught exception: ", e.stack);
  exit(127);
});

process.on("unhandledRejection", (reason: string, p: Promise<any>) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  exit(129);
});

import env from "../env";
env.name = "test";
process.env.NODE_ENV = "test";

const chalk = require("chalk");

const {app} = require("electron");
const {extname} = require("path").posix;
const {resolve} = require("path");

interface IDuration {
  title: string;
  duration: number;
}

const {sortBy} = require("underscore");

function pad (input: string, minLength: number): string {
  let s = input;
  while (s.length < minLength) {
    s = s + " ";
  }
  return s;
}

function printDurations (input: IDuration[], legend: string) {
  console.log(chalk.blue(`/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\\`));
  console.log(chalk.blue(`| ${legend}`));
  console.log(chalk.blue(`|~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|`));

  const durations = sortBy(input, "duration").reverse();
  let total = 0;
  for (const item of durations) {
    total += item.duration;
  }

  for (let i = 0; i < 8; i++) {
    if (i >= durations.length) {
      break;
    }
    const data = durations[i];
    const percent = data.duration * 100 / total;
    let percentColumn = pad(`${percent.toFixed(1)}%`, 8);
    let durationColumn = pad(`${data.duration.toFixed(2)}ms`, 12);
    let msg = `| ${percentColumn}  ${durationColumn}  "${data.title}"`;
    if (data.duration < 200) {
      console.log(chalk.blue(msg));
    } else if (data.duration < 1000) {
      console.log(chalk.yellow(msg));
    } else {
      console.log(chalk.red(msg));
    }
  }
  console.log(chalk.blue(`\\~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/`));
}

let requireDurations: IDuration[] = [];

app.on("ready", async () => {
  const glob = require("bluebird").promisify(require("glob"));
  const cwd = resolve(__dirname, "..");
  console.log(chalk.blue(`looking for tests in ${cwd}`));
  let testFiles = await glob("**/*[\.-]spec.ts", {cwd});

  const args = process.argv.slice(2);
  let state = 0;
  for (const arg of args) {
    if (state === 2) {
      testFiles = [arg.replace(/.*src\//, "")];
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

  const tape = require("tape");
  const zopf = require("zopf");
  const faucet = require("faucet");
  tape.createStream().pipe(faucet()).pipe(process.stdout);

  let requireStartedAt: number;
  let testStartedAt: number;

  tape.onFinish(async (a, b, c) => {
    let finishedAt = Date.now();

    console.log(`\n`);

    printDurations(requireDurations, `spent ${(testStartedAt - requireStartedAt).toFixed(2)}ms requiring`);
    console.log("\n\n");

    printDurations(zopf.testDurations, `spent ${(finishedAt - testStartedAt).toFixed(2)}ms running`);
    console.log("\n\n");

    const libCoverage = require("istanbul-lib-coverage");
    // tslint:disable-next-line
    let map = libCoverage.createCoverageMap(global["__coverage__"]);

    const libSourceMaps = require("istanbul-lib-source-maps");
    const sourceMapCache = libSourceMaps.createSourceMapStore();

    map = sourceMapCache.transformCoverage(map).map;

    const libReport = require("istanbul-lib-report");
    const context = libReport.createContext({dir: "coverage"});

    const reports = require("istanbul-reports");

    const tree = libReport.summarizers.pkg(map);

    // print text report to standard output
    console.log("\n\n");
    tree.visit(reports.create("text"), context);
    console.log("\n\n");

    // print text-lcov report to coverage.lcov file
    tree.visit(reports.create("lcov"), context);

    const harness = tape.getHarness();
    exit(harness._exitCode);
  });

  console.log(chalk.blue(`loading ${testFiles.length} test suites`));

  requireStartedAt = Date.now();

  for (const testFile of testFiles) {
    const requireStart = Date.now();
    const ext = extname(testFile);
    const extless = testFile.slice(0, -(ext.length));
    const requirePath = `../${extless}`;
    require(requirePath);
    const requireEnd = Date.now();
    requireDurations.push({title: requirePath, duration: requireEnd - requireStart});
    process.stdout.write(".");
  }
  console.log("");

  testStartedAt = Date.now();
});
