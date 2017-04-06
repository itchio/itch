
process.on("uncaughtException", (e: Error) => {
  // tslint:disable-next-line
  console.log("Uncaught exception: ", e.stack);
  process.exit(127);
});

require("source-map-support").install();
require("bluebird").config({
  longStackTraces: true,
});

const env = require("../env");
env.name = "test";
process.env.NODE_ENV = "test";

require("chalk").enabled = true;

const app = require("electron").app;

app.on("ready", () => {
  const tape = require("tape");
  const formatter = require("faucet");
  tape.createStream().pipe(formatter()).pipe(process.stdout);

  tape.onFinish(() => {
    app.quit();
  });

  const context = (require as any).context(".", true, /\.ts$/);
  context.keys().forEach(context);
  module.exports = context;
});
