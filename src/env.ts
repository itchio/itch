
import isDev from "electron-is-dev";
const isCanary = require("../package.json").name === "kitch";

export default {
  name: process.env.NODE_ENV || (isDev ? "development" : "production"),
  channel: isCanary ? "canary" : "stable",
}
