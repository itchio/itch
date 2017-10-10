import { join } from "path";
import { app } from "electron";

import urls from "../constants/urls";
import * as urlParser from "url";

import { IUpload, IPreferencesState } from "../types";
import { ICaveLocation } from "../db/models/cave";
import { makeLogger, Logger } from "../logger";

const APPDATA_RE = /^appdata\/(.*)$/;

/*
 * Pathmaker returns the location of disk of files that usually change from
 * one install to the other (as opposed to resources)
 */

export function appPath(cave: ICaveLocation, preferences: IPreferencesState) {
  // < 0.13.x, installFolder isn't set, it's implicitly the cave's id
  // < 18.5.x, everything is installed in an `apps` subfolder
  const {
    installLocation,
    installFolder = cave.id,
    pathScheme = PathScheme.LEGACY_PER_USER,
  } = cave;

  let appsSuffix = false;
  let base = "";

  const matches = APPDATA_RE.exec(installLocation);
  if (matches) {
    // caves migrated from 0.13.x or earlier: installed in per-user directory
    base = join(app.getPath("userData"), "users", matches[1]);
    appsSuffix = true;
  } else if (installLocation === "appdata") {
    // caves >= 0.14.x with no special install location specified
    base = join(app.getPath("userData"));
    appsSuffix = true;
  } else {
    const locations = preferences.installLocations;
    const location = locations[installLocation];
    base = location.path;
  }

  if (pathScheme === PathScheme.LEGACY_PER_USER) {
    appsSuffix = true;
  }

  if (appsSuffix) {
    return join(base, "apps", installFolder);
  } else {
    return join(base, installFolder);
  }
}

export function downloadBasePath(
  installLocation: string,
  preferences: IPreferencesState
): string {
  if (installLocation === "appdata") {
    return join(app.getPath("userData"), "downloads");
  }
  const location = preferences.installLocations[installLocation];
  return join(location.path, "downloads");
}

export function downloadFolderPath(
  upload: IUpload,
  preferences: IPreferencesState
): string {
  let slug = `${upload.id}`;
  if (upload.buildId) {
    slug = `${slug}-${upload.buildId}`;
  }

  return join(
    downloadBasePath(preferences.defaultInstallLocation, preferences),
    slug
  );
}

export function downloadFolderPathForId(
  id: string,
  preferences: IPreferencesState
): string {
  return join(
    downloadBasePath(preferences.defaultInstallLocation, preferences),
    id
  );
}

export function downloadPath(upload: IUpload, preferences: IPreferencesState) {
  if (typeof upload.filename !== "string") {
    throw new Error(`Cannot download upload without filename`);
  }

  return join(downloadFolderPath(upload, preferences), upload.filename);
}

export function globalDbPath(): string {
  let dbName = "local";
  if (urls.itchio !== urls.originalItchio) {
    dbName = fsFriendlyHost(urls.itchio);
  }
  return join(app.getPath("userData"), "marketdb", dbName + ".db");
}

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

export function mainLogPath(): string {
  return join(app.getPath("userData"), "logs", "itch.txt");
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
