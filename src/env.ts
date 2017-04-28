
import isDev from "electron-is-dev";
const isCanary = require("../package.json").name === "kitch";

// when preparing a new release, this file is replaced
// with a 'production' one. in test, 'name' is overwritten
// to be test.
const self = {
  name: process.env.NODE_ENV || (isDev ? "development" : "production"),
  channel: isCanary ? "canary" : "stable",
};

export = self;
