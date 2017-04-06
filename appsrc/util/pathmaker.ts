
import * as path from "path";
import {app} from "electron";

import * as invariant from "invariant";

import {ICaveRecordLocation, IUploadRecord, IPreferencesState} from "../types";
import {Logger} from "./log";

const APPDATA_RE = /^appdata\/(.*)$/;

export function appPath(cave: ICaveRecordLocation, preferences: IPreferencesState) {
  // < 0.13.x, installFolder isn't set, it's implicitly the cave's id
  // < 18.5.x, everything is installed in an `apps` subfolder
  const {installLocation, installFolder = cave.id, pathScheme = 1} = cave;

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

  if (pathScheme === 1) {
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
  return path.join(app.getPath("userData"), "marketdb");
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
  return new Logger({
    sinks: {
      console: true,
      file: caveLogPath(caveId),
    },
  });
}

export function userDbPath(userId: number): string {
  invariant(userId, "valid user id");
  return path.join(app.getPath("userData"), "users", "" + userId, "marketdb");
}

export function sanitize(file: string): string {
  const sane = file.replace(/[^a-zA-Z0-9_ -]/g, "").replace(/[\s]+/, " ");
  if (sane.length > 0) {
    return sane;
  } else {
    return "nihilo";
  }
}

export default {
  appPath, downloadPath, globalDbPath, userDbPath, sanitize,
  preferencesPath, logPath, updaterLogPath, caveLogPath, caveLogger,
};
