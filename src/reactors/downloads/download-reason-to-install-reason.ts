
import {DownloadReason, InstallReason} from "../types";

export default function (reason: DownloadReason): InstallReason {
  switch (reason) {
    case "heal":
      return "heal";
    case "install":
      return "install";
    case "reinstall":
      return "reinstall";
    default: return null;
  }
}
