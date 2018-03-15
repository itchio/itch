import { platform } from "../../os";
import { AutoUpdaterStart } from "./types";

import win32AutoUpdater from "./win32";
import linuxAutoUpdater from "./linux";
import darwinAutoUpdater from "./darwin";

let exported: AutoUpdaterStart;

switch (platform()) {
  case "win32":
    exported = win32AutoUpdater;
    break;
  case "darwin":
    exported = darwinAutoUpdater;
    break;
  case "linux":
    exported = linuxAutoUpdater;
    break;
}

export default exported;
