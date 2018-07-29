import ospath from "path";
import spawn from "main/os/spawn";
import env from "common/env";
import { MinimalContext } from "main/context";
import { Store } from "common/types";
import { Logger } from "common/logger";

export const itchSetupLock = {
  reason: null as string,
  async with(
    logger: Logger,
    reason: string,
    f: () => Promise<void>
  ): Promise<boolean> {
    if (this.reason) {
      logger.info(`itch-setup lock is already acquired (${this.reason})`);
      return false;
    }

    try {
      this.reason = reason;
      await f();
    } finally {
      this.reason = null;
    }
    return true;
  },
};

export interface RunItchSetupOpts {
  args: string[];
  logger: Logger;
  onMessage: (msg: ISM) => void;
}

export async function runItchSetup(
  store: Store,
  opts: RunItchSetupOpts
): Promise<boolean> {
  const { args, logger, onMessage } = opts;

  const rs = store.getState();
  const pkg = rs.broth.packages["itch-setup"];
  if (pkg.stage !== "idle") {
    logger.warn(`itch-setup: wanted pkg stage idle but got '${pkg.stage}'`);
    return false;
  }

  const prefix = pkg.versionPrefix;
  if (!prefix) {
    logger.warn(`itch-setup: no prefix (not installed yet?)`);
    return false;
  }

  await spawn({
    ctx: new MinimalContext(),
    logger: logger.child(__filename),
    command: ospath.join(prefix, "itch-setup"),
    args: ["--appname", env.appName, ...args],
    onToken: (tok: string) => {
      try {
        const msg = JSON.parse(tok) as ISM;
        onMessage(msg);
      } catch (e) {
        logger.debug(`> ${tok}`);
      }
    },
    onErrToken: (tok: string) => {
      logger.debug(`> ${tok}`);
    },
  });
  return true;
}

export interface ISM {
  type:
    | "log"
    | "progress"
    | "installing-update"
    | "update-ready"
    | "no-update-available"
    | "update-failed"
    | "ready-to-relaunch";
  payload: any;
}

export interface ISM_Log {
  level: string;
  message: string;
}

export interface ISM_Progress {
  progress: number;
  bps: number;
  eta: number;
}

export interface ISM_InstallingUpdate {
  version: string;
}

export interface ISM_UpdateReady {
  version: string;
}

export interface ISM_UpdateFailed {
  message: string;
}

export interface ISM_ReadyToRelaunch {}
