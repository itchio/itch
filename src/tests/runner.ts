// tslint:disable:no-console

process.on("uncaughtException", (e: Error) => {
  console.log("Uncaught exception: ", e.stack);
  process.exit(127);
});

process.on("unhandledRejection", (reason: string, p: Promise<any>) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  process.exit(1);
});

require("source-map-support").install();
const bluebird = require("bluebird");
bluebird.config({
  longStackTraces: true,
});

const env = require("../env");
env.name = "test";
process.env.NODE_ENV = "test";

const chalk = require("chalk");

const {app} = require("electron");
const {join, extname} = require("path").posix;

app.on("ready", async () => {
  const glob = require("bluebird").promisify(require("glob"));
  const testFiles = await glob("**/*-spec.ts", {cwd: __dirname});

  const tape = require("tape");
  const formatter = require("faucet");
  tape.createStream().pipe(formatter()).pipe(process.stdout);

  tape.onFinish(() => {
    app.quit();
  });

  console.log(chalk.blue(`loading ${testFiles.length} test suites`));

  for (const testFile of testFiles) {
    const ext = extname(testFile);
    const extless = testFile.slice(0, -(ext.length));
    const requirePath = `./${extless}`;
    require(requirePath);
  }
});
