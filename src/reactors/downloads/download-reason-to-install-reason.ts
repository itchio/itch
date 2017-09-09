import { DownloadReason, InstallReason } from "../../types";

export default function(reason: DownloadReason): InstallReason {
  return reason;
}
