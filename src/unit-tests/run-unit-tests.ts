// tslint:disable:no-console

let watching = false;
let runConfidenceTests = false;
let chatty = false;

function exit (exitCode) {
  if (process.env.ITCH_DONT_EXIT === "1") {
    console.log(`Should exit with code ${exitCode}, but asked not to`);
    return;
  }
  
  if (watching) {
    console.log(`Watching, so not exiting`);
    return;
  }
  app.exit(exitCode);
}

process.on("uncaughtException", (e: Error) => {
  console.log("Uncaught exception: ", e.stack);
  exit(127);
});

process.on("unhandledRejection", (reason: string, p: Promise<any>) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  exit(129);
});

const chalk = require("chalk");
const bluebird = require("bluebird");

const {app} = require("electron");
const path = require("path");

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
  console.log(chalk.blue(`${legend}`));

  const durations = sortBy(input, "duration").reverse();
  let total = 0;
  for (const item of durations) {
    total += item.duration;
  }

  for (const data of durations) {
    const percent = data.duration * 100 / total;
    let percentColumn = pad(`${percent.toFixed(1)}%`, 8);
    let durationColumn = pad(`${data.duration.toFixed(2)}ms`, 12);
    let msg = `[slow test] ${percentColumn}  ${durationColumn}  "${data.title}"`;
    if (data.duration < 100) {
      // don't print
    } else if (data.duration < 200) {
      console.log(chalk.green(msg));
    } else if (data.duration < 500) {
      console.log(chalk.yellow(msg));
    } else {
      console.log(chalk.red(msg));
    }
  }
}

const cwd = process.cwd();

function flush () {
  process.removeAllListeners("exit");

  Object.keys(require.cache).forEach(function (fname) {
    if (fname.indexOf("node_modules") === -1) {
      delete require.cache[fname];
    }

    const mods = ["tape", "zopf", "typeorm"];
    mods.forEach(function (mod) {
      if (fname.indexOf(path.join(cwd, mod) + path.sep) > -1 ||
        fname.indexOf(path.join(cwd, "node_modules", mod) + path.sep) > -1) {
        delete require.cache[fname];
      }
    });
  });
}

app.on("ready", async () => {
  const glob = require("glob").sync;
  const srcDir = path.resolve(__dirname, "..");

  let specifiedFiles = [];

  const args = process.argv.slice(2);
  let state = 0;
  for (const arg of args) {
    if (arg === "--watch" || arg === "-w") {
      watching = true;
      continue;
    }
    if (state === 2) {
      specifiedFiles = [arg.replace(/.*src\//, "")];
      console.log(`Unit test runner only running ${JSON.stringify(specifiedFiles)}`);
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

  const tapParser = require("tap-parser");

  const invoke = async () => {
    // tslint:disable-next-line
    delete global["__coverage__"];
    const tape = require("tape");
    const zopf = require("zopf");
    const parser = tapParser(function (results) {
      // muffin;
    });
    parser.on("assert", function (assert) {
      if (!assert.ok) {
        console.warn("[failed] " + assert.id + " - " + assert.name);
        if (assert.diag) {
          console.warn(assert.diag);
        }
      }
    });
    tape.createStream().pipe(parser);

    let testFiles = specifiedFiles;
    if (testFiles.length === 0) {
      if (chatty) {
        console.log(chalk.blue(`looking for tests in ${srcDir}`));
      }  
      testFiles = glob("**/*[\.-]spec.ts", {cwd: srcDir});
      if (!runConfidenceTests) {
        testFiles = testFiles.filter((f) => !/confidence/.test(f));
      }
    }

    let requireStartedAt: number;
    let testStartedAt: number;

    const p = new Promise((resolve, reject) => {
      tape.onFinish(async () => {
        let finishedAt = Date.now();

        const msg = `finished ${testFiles.length} suites in ${(finishedAt - testStartedAt).toFixed(2)}ms`;
        printDurations(zopf.testDurations, msg);

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

        // print text-lcov report to coverage.lcov file
        tree.visit(reports.create("lcov"), context);

        const harness = tape.getHarness();
        resolve(harness._exitCode);
      });
    });

    if (chatty) {
      console.log(chalk.blue(`loading ${testFiles.length} test suites`));
    }

    requireStartedAt = Date.now();

    for (const testFile of testFiles) {
      const ext = path.posix.extname(testFile);
      const extless = testFile.slice(0, -(ext.length));
      const requirePath = `../${extless}`;
      require(requirePath);
      if (chatty) {
        process.stdout.write(".");
      }
    }
    if (chatty) {
      console.log("");
    }

    testStartedAt = Date.now();
    return await p;
  };

  const debounce = require("debounce-collect");
  const mutex = require("./mutex").default;

  const report = debounce(mutex(async function () {
    flush();
    console.log("");
    const exitCode = await invoke();
    if (!watching) {
      exit(exitCode);
    }
    await bluebird.delay(250);
    console.log("watching for changes...");
  }), 25);

  if (watching) {
    const chokidar = require("chokidar");
    const watcher = chokidar.watch(".", {
      ignored: /[\/\\]\.|node_modules|coverage|tmp|\.git/,
      persistent: true,
      ignoreInitial: true,
    });
    watcher.on("change", report);
    watcher.on("add", report);
    watcher.on("unlink", report);
    report();
  } else {
    report();
  }
});
