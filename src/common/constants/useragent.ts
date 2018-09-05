import * as electron from "electron";
const app = electron.app || electron.remote.app;

let _cachedUserAgent: string;
export function userAgent() {
  if (!_cachedUserAgent) {
    _cachedUserAgent =
      `itch/${app.getVersion()} (${process.platform}; ` +
      `Electron/${process.versions.electron} Chrome/${
        process.versions.chrome
      })`;
  }
  return _cachedUserAgent;
}

let _cachedButlerUserAgent: string;
export function butlerUserAgent() {
  if (!_cachedButlerUserAgent) {
    _cachedButlerUserAgent = `itch/${app.getVersion()} (${process.platform})`;
  }
  return _cachedButlerUserAgent;
}
