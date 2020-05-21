import { levelNumbers } from "common/logger";

export const envSettings = {
  //-----------------------
  // booleans
  //-----------------------

  dumpEnvSettings: process.env.DUMP_ENV_SETTINGS === "1",

  // Dump all main<->renderer Socket traffic - *very* verbose.
  verboseSocket: process.env.ITCH_VERBOSE_SOCKET === "1",

  // Open devtools on startup (for shell BrowserWindow)
  devtools: process.env.DEVTOOLS === "1",

  // Open devtools on HTML5 game startup (for game BrowserWindow)
  gameDevtools: process.env.IMMEDIATE_NOSE_DIVE === "1",

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
