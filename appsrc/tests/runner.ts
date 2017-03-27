
require("source-map-support").install();
require("bluebird").config({
  longStackTraces: true,
});

const env = require("../env");
env.name = "test";
process.env.NODE_ENV = "test";

const context = (require as any).context(".", true, /\.ts$/);
context.keys().forEach(context);
module.exports = context;
