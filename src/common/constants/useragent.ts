import * as electron from "electron";
const app = electron.app || electron.remote.app;
const session = electron.session || electron.remote.session;

let _cachedUserAgent: string;
export function userAgent() {
  if (!_cachedUserAgent) {
    _cachedUserAgent = `${session.defaultSession.getUserAgent()} itch/${app.getVersion()}`;
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
