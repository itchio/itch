import { join } from "path";
import electron from "electron";
const app = electron.app || electron.remote.app;

import urls from "main/constants/urls";
import urlParser from "url";
import { envSettings } from "main/constants/env-settings";

export function usersPath(): string {
  let usersPath = join(app.getPath("userData"), "users");
  if (urls.itchio !== urls.originalItchio) {
    usersPath = join(usersPath, fsFriendlyHost(urls.itchio));
  }
  return usersPath;
}

export function fsFriendlyHost(url: string): string {
  const parsed = urlParser.parse(url);
  if (parsed.host) {
    return parsed.host.replace(/[^a-zA-Z0-9\.]/g, "-");
  } else {
    return "no-host";
  }
}

export function preferencesPath(): string {
  return join(app.getPath("userData"), "preferences.json");
}

export function butlerDbPath(): string {
  let dbName = "butler.db";
  if (envSettings.customItchServer) {
    dbName = `butler-${fsFriendlyHost(urls.itchio)}.db`;
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
