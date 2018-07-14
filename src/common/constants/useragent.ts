import { app, remote } from "electron";

export let userAgent: () => string;
export let butlerUserAgent: () => string;

if (process.type === "browser") {
  userAgent = () =>
    `itch/${app.getVersion()} (${process.platform}; ` +
    `Electron/${process.versions.electron} Chrome/${process.versions.chrome})`;

  butlerUserAgent = () => `itch/${app.getVersion()} (${process.platform})`;
} else {
  let remoteModule = remote.require("./constants/useragent");

  let _cachedUserAgent = remoteModule.userAgent();
  userAgent = () => _cachedUserAgent;

  let _cachedButlerUserAgent = remoteModule.butlerUserAgent();
  butlerUserAgent = () => _cachedButlerUserAgent;
}
