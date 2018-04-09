const isDev = require("electron-is-dev");
import { readFileSync } from "fs";
const isCanary =
  JSON.parse(readFileSync("package.json", { encoding: "utf8" })).name ===
  "kitch";

const envName = process.env.NODE_ENV || (isDev ? "development" : "production");

export default {
  channel: isCanary ? "canary" : "stable",
  appName: isCanary ? "kitch" : "itch",
  integrationTests: !!process.env.ITCH_INTEGRATION_TESTS,
  unitTests: false,
  development: envName === "development",
  production: envName === "production",
};
