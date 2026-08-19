import { join } from "path";
import electron from "electron";
const app =
  electron.app ||
  (() => {
    throw new Error("fail in paths.ts");
  })();

import urls from "common/constants/urls";

export function preferencesPath(): string {
  return join(app.getPath("userData"), "preferences.json");
}

export function butlerDbPath(): string {
  let dbName = "butler.db";
  if (urls.itchio !== urls.originalItchio) {
    dbName = `butler-${new URL(urls.itchio).host.replace(
      /^[A_Za-z\._\-]/g,
      "_"
    )}.db`;
  }
  return join(app.getPath("userData"), "db", dbName);
}

export function prereqsPath(): string {
  return join(app.getPath("userData"), "prereqs");
}

export function appdataLocationPath(): string {
  return join(app.getPath("userData"), "apps");
}

export function mainLogPath(): string {
  return join(app.getPath("userData"), "logs", "itch.txt");
}

export function relaunchLogPath(): string {
  return join(app.getPath("userData"), "logs", "itch.relaunch.txt");
}

export function legacyMarketPath(): string {
  return join(app.getPath("userData"), "marketdb");
}
