
import * as path from "path";
import * as electron from "electron";

const app = electron.app || electron.remote.app;

import * as invariant from "invariant";
import urls from "../constants/urls";
import * as urlParser from "url";

import {ICaveRecordLocation, IUploadRecord, IPreferencesState} from "../types";
import {makeLogger, Logger} from "../logger";

const APPDATA_RE = /^appdata\/(.*)$/;

/*
 * Pathmaker returns the location of disk of files that usually change from
 * one install to the other (as opposed to resources)
 */

export function appPath(cave: ICaveRecordLocation, preferences: IPreferencesState) {
  // < 0.13.x, installFolder isn't set, it's implicitly the cave's id
  // < 18.5.x, everything is installed in an `apps` subfolder
  const {installLocation, installFolder = cave.id, pathScheme = PathScheme.LEGACY_PER_USER} = cave;

  invariant(typeof installLocation === "string", "valid install location name");
  invariant(typeof installFolder === "string", "valid install folder");

  let appsSuffix = false;
  let base = "";

  const matches = APPDATA_RE.exec(installLocation);
  if (matches) {
    // caves migrated from 0.13.x or earlier: installed in per-user directory
    base = path.join(app.getPath("userData"), "users", matches[1]);
    appsSuffix = true;
  } else if (installLocation === "appdata") {
    // caves >= 0.14.x with no special install location specified
    base = path.join(app.getPath("userData"));
    appsSuffix = true;
  } else {
    const locations = preferences.installLocations;
    const location = locations[installLocation];
    invariant(location, "install location exists");
    base = location.path;
  }

  if (pathScheme === PathScheme.LEGACY_PER_USER) {
    appsSuffix = true;
  }

  if (appsSuffix) {
    return path.join(base, "apps", installFolder);
  } else {
    return path.join(base, installFolder);
  }
}

export function downloadPath(upload: IUploadRecord, preferences: IPreferencesState) {
  invariant(typeof upload === "object", "valid upload");
  invariant(upload.id, "upload has id");
  invariant(typeof upload.filename === "string", "upload has filename");
  const extMatches = /(\.tar)?\.[^\.]+$/i.exec(upload.filename);
  const ext = extMatches ? extMatches[0] : "";

  let slug = `${upload.id}`;
  if (upload.buildId) {
    slug = `${slug}-${upload.buildId}`;
  }

  const {installLocations, defaultInstallLocation} = preferences;
  if (defaultInstallLocation === "appdata") {
    return path.join(app.getPath("userData"), "downloads", "" + slug + ext.toLowerCase());
  } else {
    const location = installLocations[defaultInstallLocation];
    return path.join(location.path, "downloads", "" + slug + ext.toLowerCase());
  }
}

export function globalDbPath(): string {
  let dbName = "local";
  if (urls.itchio !== urls.originalItchio) {
    dbName = fsFriendlyHost(urls.itchio);
  }
  return path.join(app.getPath("userData"), "marketdb", dbName + ".db");
}

export function usersPath(): string {
  let usersPath = path.join(app.getPath("userData"), "users");
  if (urls.itchio !== urls.originalItchio) {
    usersPath = path.join(usersPath, fsFriendlyHost(urls.itchio));
  }
  return usersPath;
}

export function fsFriendlyHost(url: string): string {
  const parsed = urlParser.parse(url);
  return parsed.host.replace(/[^a-zA-Z0-9\.]/g, "-");
}

export function preferencesPath(): string {
  return path.join(app.getPath("userData"), "preferences.json");
}

export function logPath(): string {
  return path.join(app.getPath("userData"), "logs", "itch.txt");
}

export function updaterLogPath(): string {
  return path.join(app.getPath("userData"), "logs", "itch.updater.txt");
}

export function caveLogPath(caveId: string): string {
  return path.join(app.getPath("userData"), "cave-logs", "cave-" + caveId + ".txt");
}

export function caveLogger(caveId: string): Logger {
  return makeLogger(caveLogPath(caveId));
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
};
