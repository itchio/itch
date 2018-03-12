import { Cave } from "../buse/messages";

export type TaskName =
  | "install-queue"
  | "install"
  | "uninstall"
  | "configure"
  | "launch";

export interface IQueueUninstallOpts {
  /** which cave we're uninstalling */
  caveId: string;
}

export interface IQueueLaunchOpts {
  /** which cave we're launching */
  cave: Cave;
}
