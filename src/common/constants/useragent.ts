import { app, remote } from "electron";

export let userAgent: () => string;

if (process.type === "browser") {
  userAgent = () =>
    `itch/${app.getVersion()} (${process.platform}; ` +
    `Electron/${process.versions.electron} Chrome/${process.versions.chrome})`;
} else {
  let _cached = remote.require("./constants/useragent").userAgent();
  userAgent = () => _cached;
}
