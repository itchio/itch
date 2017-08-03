// tslint:disable:no-console

let watching = false;
let thorough = false;
let chatty = false;
let hangAround = false;

function exit(exitCode) {
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

const { app } = require("electron");
const path = require("path");

interface IDuration {
  title: string;
  duration: number;
}

const { sortBy } = require("underscore");

function pad(input: string, minLength: number): string {
  let s = input;
  while (s.length < minLength) {
    s = s + " ";
  }
  return s;
}

function printDurations(input: IDuration[], legend: string) {
  console.log(chalk.blue(`${legend}`));

  const durations = sortBy(input, "duration").reverse();
  let total = 1;
  for (const item of durations) {
    if (item.duration && !isNaN(item.duration)) {
      total += item.duration;
    }
  }

  let format = data => {
    let duration = data.duration || 0;
    const percent = duration * 100 / total;
    let percentColumn = pad(`${percent.toFixed(1)}%`, 8);
    let durationColumn = pad(`${duration.toFixed(2)}ms`, 12);
    return `${percentColumn}  ${durationColumn}  "${data.title}"`;
  };

  let unprinted = [];
  for (const data of durations) {
    if (!data.duration) {
      // don't print
      continue;
    }
    if (data.duration < 100) {
      // don't print
      unprinted.push(data);
    } else if (data.duration < 200) {
      const msg = "[sorta long] " + format(data);
      console.log(chalk.green(msg));
    } else if (data.duration < 500) {
      const msg = "[   long   ] " + format(data);
      console.log(chalk.yellow(msg));
    } else {
      const msg = "[ too long ] " + format(data);
      console.log(chalk.red(msg));
    }
  }

  unprinted = sortBy(unprinted, "duration").reverse();
  if (unprinted.length > 0) {
    console.log(chalk.blue(`${format(unprinted[0])}`));
  }
}

const cwd = process.cwd();

function flush() {
  // tslint:disable-next-line
  delete global["__coverage__"];

  Object.keys(require.cache).forEach(function(fname) {
    if (fname.indexOf("node_modules") === -1) {
      delete require.cache[fname];
    }

    const mods = ["tape", "zopf"];
    mods.forEach(function(mod) {
      if (
        fname.indexOf(path.join(cwd, mod) + path.sep) > -1 ||
        fname.indexOf(path.join(cwd, "node_modules", mod) + path.sep) > -1
      ) {
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

    if (arg === "--thorough") {
      thorough = true;
      continue;
    }

    if (arg === "--hang-around") {
      hangAround = true;
      continue;
    }

    if (state === 2) {
      specifiedFiles = [arg.replace(/.*src\//, "")];
      console.log(
        `Unit test runner only running ${JSON.stringify(specifiedFiles)}`,
      );
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

  const invoke = async () => {
    // tslint:disable-next-line
    const tape = require("tape");
    const zopf = require("zopf");

    const nodeModulesPath = path.resolve(__dirname, "..", "..", "node_modules");
    const srcPath = path.resolve(__dirname, "..", "..");

    const through = require("through");
    let lastTest = "";

    const printStack = (stack: string) => {
      const lines = stack.split(/\r?\n/);
      const header = lines.shift();
      console.log("  " + chalk.red(header));
      let skipping = false;
      for (const line of lines) {
        if (/From previous/.test(line)) {
          console.log(`  ${line}`);
          continue;
        }

        let formattedLine = line
          .trim()
          .replace(/^at\s+/, "")
          .replace(nodeModulesPath, "@")
          .replace(srcPath, ".")
          .replace(/\\/g, "/")
          .replace(/@\//g, "@");
        if (/\.\/src|\.ts/.test(formattedLine)) {
          console.log(chalk.blue("    → " + formattedLine));
          skipping = false;
        } else {
          if (!skipping) {
            skipping = true;
            // console.log(chalk.grey("    → " + formattedLine));
            console.log("      ...");
          }
        }
      }
    };

    const indentLines = (numSpaces: number, input: string) => {
      const lines = (input || "").split("\n");
      const indent = " ".repeat(numSpaces);
      return lines.map(l => indent + l).join("\n");
    };

    const parser = through(function(data) {
      if (data.type === "assert") {
        if (!data.ok) {
          console.log(chalk.red("✘ " + lastTest));
          if (data.operator === "error") {
            printStack(data.actual.stack);
          } else {
            console.log(chalk.red(`  ${data.name}, operator ${data.operator}`));
            console.log(
              `    expected:\n${chalk.blue(
                indentLines(8, JSON.stringify(data.expected, null, 2)),
              )}`,
            );
            console.log(
              `    actual  :\n${chalk.blue(
                indentLines(8, JSON.stringify(data.actual, null, 2)),
              )}`,
            );
            if (data.error) {
              printStack(data.error.stack);
            } else {
              console.log("  at " + chalk.red(data.at));
            }
          }
          console.log("");
        }
      } else if (data.type === "test") {
        lastTest = data.name;
      }
    });
    const harness = tape.getHarness({
      exit: false,
      stream: parser,
      objectMode: true,
    });
    let testFiles = specifiedFiles;
    if (testFiles.length === 0) {
      if (chatty) {
        console.log(chalk.blue(`looking for tests in ${srcDir}`));
      }
      testFiles = glob("**/*[.-]spec.ts", { cwd: srcDir });
      if (!thorough) {
        // exclude files containing slow.spec if not during a thorough run
        testFiles = testFiles.filter(f => !/slow\.spec/.test(f));
      }
    }

    let requireStartedAt: number;
    let testStartedAt: number;

    const p = new Promise((resolve, reject) => {
      tape.onFinish(async () => {
        let finishedAt = Date.now();

        const msg = `finished ${testFiles.length} suites in ${(finishedAt -
          testStartedAt).toFixed(2)}ms`;
        printDurations(zopf.testDurations, msg);

        const libCoverage = require("istanbul-lib-coverage");
        // tslint:disable-next-line
        let map = libCoverage.createCoverageMap(global["__coverage__"]);

        const libSourceMaps = require("istanbul-lib-source-maps");
        const sourceMapCache = libSourceMaps.createSourceMapStore();

        map = sourceMapCache.transformCoverage(map).map;

        const libReport = require("istanbul-lib-report");
        const context = libReport.createContext({ dir: "coverage" });

        const reports = require("istanbul-reports");

        const tree = libReport.summarizers.pkg(map);

        // print text-lcov report to coverage.lcov file
        tree.visit(reports.create("lcov"), context);

        resolve(harness._exitCode);
      });
    });

    if (chatty) {
      console.log(chalk.blue(`loading ${testFiles.length} test suites`));
    }

    requireStartedAt = Date.now();

    for (const testFile of testFiles) {
      const ext = path.posix.extname(testFile);
      const extless = testFile.slice(0, -ext.length);
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

  const report = debounce(
    mutex(async function() {
      flush();
      console.log("");
      const exitCode = await invoke();
      if (!watching) {
        if (hangAround) {
          console.log("Hanging around...");
        } else {
          exit(exitCode);
        }
      }
      await bluebird.delay(250);
      console.log("watching for changes...");
    }),
    25,
  );

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
