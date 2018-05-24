import { join } from "path";
import electron from "electron";
const app = electron.app || electron.remote.app;

import urls from "common/constants/urls";
import urlParser from "url";

import { makeLogger, Logger } from "common/logger";

export function usersPath(): string {
  let usersPath = join(app.getPath("userData"), "users");
  if (urls.itchio !== urls.originalItchio) {
    usersPath = join(usersPath, fsFriendlyHost(urls.itchio));
  }
  return usersPath;
}

export function fsFriendlyHost(url: string): string {
  const parsed = urlParser.parse(url);
  return parsed.host.replace(/[^a-zA-Z0-9\.]/g, "-");
}

export function preferencesPath(): string {
  return join(app.getPath("userData"), "preferences.json");
}

export function butlerDbPath(): string {
  return join(app.getPath("userData"), "db", "butler.db");
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

export function updaterLogPath(): string {
  return join(app.getPath("userData"), "logs", "itch.updater.txt");
}

export function caveLogPath(caveId: string): string {
  return join(app.getPath("userData"), "cave-logs", "cave-" + caveId + ".txt");
}

export function caveLogger(caveId: string): Logger {
  return makeLogger({ logPath: caveLogPath(caveId) });
}

export function sanitize(file: string): string {
  const sane = file.replace(/[^a-zA-Z0-9_ -]/g, "").replace(/[\s]+/, " ");
  if (sane.length > 0) {
    return sane;
  } else {
    return "nihilo";
  }
}

export enum PathScheme {
  LEGACY_PER_USER = 1,
  MODERN_SHARED = 2,
}
