import { levelNumbers } from "common/logger";
import { mainLogger } from "main/logger";
import dump from "common/util/dump";

export const envSettings = {
  //-----------------------
  // booleans
  //-----------------------

  dumpEnvSettings: process.env.DUMP_ENV_SETTINGS === "1",

  // Use copy of butler in $PATH - use when developing
  // new butlerd functionality concurrently wih itch
  localButler: process.env.LOCAL_BUTLER === "1",

  // Dump all main<->renderer WebSocket traffic - *very* verbose.
  verboseWebSocket: process.env.ITCH_VERBOSE_WS === "1",

  // Open devtools on startup (for shell BrowserWindow)
  devtools: process.env.DEVTOOLS === "1",

  // This is set when running integration tests
  integrationTests: process.env.ITCH_INTEGRATION_TESTS === "1",

  // This prints combinations like "Ctrl+Shift+C" that were pressed
  logInputs: process.env.ITCH_LOG_INPUTS === "1",

  //-----------------------
  // strings
  //-----------------------

  // Use when developing itch.io server concurrently with itch
  customItchServer: process.env.WHEN_IN_ROME,

  // Set to `debug` if you're trying to figure out what's going on.
  // This only affects console output - the log files always contain
  // all levesl
  logLevel: levelNumbers[process.env.ITCH_LOG_LEVEL || "info"],
};
