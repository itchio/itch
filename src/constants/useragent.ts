
import {app, remote} from "electron";
import * as os from "../os";

let userAgent: string;

// TODO: investigate - is that needed?

if (os.processType() === "browser") {
  userAgent = `itch/${app.getVersion()} (${os.platform()}; ` +
    `Electron/${os.getVersion("electron")} Chrome/${os.getVersion("chrome")})`;
} else {
  userAgent = remote.require("./constants/useragent");
}

export default userAgent;
