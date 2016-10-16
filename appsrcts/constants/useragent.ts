
import { app } from "../electron";
import { remote } from "electron";
import os from "../util/os";

if (os.processType() === "browser") {
  module.exports = `itch/${app.getVersion()} (${os.platform()}; ` +
    `Electron/${os.getVersion("electron")} Chrome/${os.getVersion("chrome")})`;
} else {
  module.exports = remote.require("./constants/useragent");
}
