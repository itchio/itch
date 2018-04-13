import { app, remote } from "electron";
import * as os from "main/os";

export let userAgent: () => string;

if (os.processType() === "browser") {
  userAgent = () =>
    `itch/${app.getVersion()} (${os.platform()}; ` +
    `Electron/${os.getVersion("electron")} Chrome/${os.getVersion("chrome")})`;
} else {
  let _cached = remote.require("./constants/useragent").userAgent();
  userAgent = () => _cached;
}
