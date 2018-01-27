let watching = false;
let thorough = true;
let chatty = false;
let hangAround = false;

require("../logger").default.setLevel("silent");

function exit(exitCode) {
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
    console.log("[    ok    ] " + chalk.blue(`${format(unprinted[0])}`));
  }
}

const cwd = process.cwd();

function flush() {
  delete global["__coverage__"];

  Object.keys(require.cache).forEach(function(fname) {
    // unload everything that's *not* in node_modules
    if (fname.indexOf("node_modules") === -1) {
      // ... except the logger
      if (fname.indexOf("logger") === -1) {
        delete require.cache[fname];
      }
    }

    // unload tape and zopf from node_modules
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

    if (arg === "--shallow") {
      thorough = false;
      continue;
    }

    if (arg === "--hang-around") {
      hangAround = true;
      continue;
    }

    if (state === 2) {
      specifiedFiles = [arg.replace(/\\/g, "/").replace(/.*src\//, "")];
      console.log(
        `Unit test runner only running ${JSON.stringify(specifiedFiles)}`
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
    const tape = require("tape");
    const zopf = require("zopf");
    const env = require("../env").default;
    env.unitTests = true;

    const nodeModulesPath = path.resolve(__dirname, "..", "..", "node_modules");
    const srcPath = path.resolve(__dirname, "..", "..");

    const through = require("through");

    const formatLine = (line: string) => {
      return line
        .trim()
        .replace(/^at\s+/, "")
        .replace(nodeModulesPath, "@")
        .replace(srcPath, ".")
        .replace(/\\/g, "/")
        .replace(/@\//g, "@");
    };

    const printStack = (stack: string, message: string) => {
      const lines = stack.split(/\r?\n/);
      let header = lines.shift();
      let skipping = false;
      let firstLine = null;
      const formattedLines = [];
      formattedLines.push(chalk.red(header));

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (/From previous/.test(line)) {
          formattedLines.push(`  ${line}`);
          continue;
        }

        let formattedLine = formatLine(line);
        if (/\.\/src|\.ts/.test(formattedLine)) {
          console.log("formattedLine: ", formattedLine);
          if (!firstLine) {
            // this matches all .ts and .tsx files in `./src` (which we get
            // even on windows because of `formatLine`) in the format:
            // `./src/fetchers/game-fetcher/spec.ts:85:9`
            const matches = /(\.\/src.+\.tsx?:[0-9]+:[0-9]+)/.exec(
              formattedLine
            );
            if (matches && /\.spec\.ts/.test(matches[1])) {
              let location = matches[1];
              let fileName = location.split(":")[0];
              if (i + 1 < lines.length) {
                let nextFormattedLine = formatLine(lines[i + 1]);
                // has same file name, doesn't have parentheses
                if (
                  nextFormattedLine.indexOf(fileName) !== -1 &&
                  nextFormattedLine.indexOf("(") === -1
                ) {
                  // sometimes bluebird generates stack traces with something like:
                  //   → runGameFetcher (./src/fetchers/game-fetcher.spec.ts:45:42)
                  //   → ./src/fetchers/game-fetcher.spec.ts:29:13
                  // in that case, the first line/column pair is wrong, the second one is right
                  location = nextFormattedLine;
                }
              }
              firstLine = chalk.red(`✘ ${location}: ${message}`);
            }
          }
          formattedLines.push(chalk.blue("    → " + formattedLine));
          skipping = false;
        } else {
          if (!skipping) {
            skipping = true;
            formattedLines.push("      ...");
          }
        }
      }

      console.log(firstLine);
      for (const formattedLine of formattedLines) {
        console.log(formattedLine);
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
          // TODO: re-handle data.at
          let stack;
          if (data.operator === "error") {
            stack = data.actual.stack;
          } else if (data.operator === "fail") {
            stack = data.name.stack;
          } else if (data.error) {
            stack = data.error.stack;
          } else {
            stack = [];
          }

          let singleLineMessage = ``;
          if (data.operator !== "error") {
            singleLineMessage += chalk.red(`${data.name} (${data.operator})`);

            if (
              typeof data.expected !== "undefined" ||
              typeof data.actual !== "undefined"
            ) {
              singleLineMessage += ": wanted ";
              singleLineMessage += chalk.blue(
                `${JSON.stringify(data.expected)}`
              );
              singleLineMessage += ", got ";
              singleLineMessage += chalk.blue(`${JSON.stringify(data.actual)}`);
            }
          }
          printStack(stack, singleLineMessage);

          if (data.operator !== "error") {
            console.log(chalk.red(`  ${data.name}, operator ${data.operator}`));
            console.log(
              `    expected:\n${chalk.blue(
                indentLines(8, JSON.stringify(data.expected, null, 2))
              )}`
            );
            console.log(
              `    actual  :\n${chalk.blue(
                indentLines(8, JSON.stringify(data.actual, null, 2))
              )}`
            );
          }
          console.log("");
        }
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

    let testStartedAt: number;

    const p = new Promise((resolve, reject) => {
      tape.onFinish(async () => {
        let finishedAt = Date.now();

        const msg = `finished ${testFiles.length} suites in ${(finishedAt -
          testStartedAt).toFixed(2)}ms`;
        printDurations(zopf.testDurations, msg);

        const libCoverage = require("istanbul-lib-coverage");
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

        let finishedCoverageAt = Date.now();
        console.log(
          `coverage took ${(finishedCoverageAt - finishedAt).toFixed(2)}ms`
        );

        if (harness._exitCode === 0) {
          console.log(chalk.green("[ OK ]"));
        } else {
          console.log(chalk.red("[FAIL]"));
        }
        resolve(harness._exitCode);
      });
    });

    if (chatty) {
      console.log(chalk.blue(`loading ${testFiles.length} test suites`));
    }

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
          return;
        }
      }
      await bluebird.delay(250);
      console.log("watching for changes...");
    }),
    25
  );

  if (watching) {
    const { Gaze } = require("gaze");
    const watcher = new Gaze("./src/**/*");
    watcher.on("all", report);
    report();
  } else {
    report();
  }
});
