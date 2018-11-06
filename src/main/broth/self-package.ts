import { PackageLike, UpgradeOpts, EnsureOpts } from "main/broth/package";
import { Store, PackageState } from "common/types";
import {
  itchSetupLock,
  runItchSetup,
  ISM,
  RunItchSetupOpts,
  ISM_UpdateFailed,
  ISM_UpdateReady,
  ISM_Progress,
  ISM_Log,
} from "main/broth/itch-setup";
import { actions } from "common/actions";
import { Logger } from "common/logger";

export class SelfPackage implements PackageLike {
  private store: Store;
  private name: string;

  constructor(store: Store, name: string) {
    this.store = store;
    this.name = name;
  }

  async ensure(opts: EnsureOpts) {
    const rs = this.store.getState();
    this.store.dispatch(
      actions.packageGotVersionPrefix({
        name: this.name,
        version: rs.system.appVersion,
        versionPrefix: rs.system.userDataPath,
      })
    );
  }

  async upgrade(opts: UpgradeOpts) {
    const logger = this.makeLogger(opts.logger);

    try {
      await itchSetupLock.with(logger, "check for self-update", async () => {
        const { store } = this;
        const opts: RunItchSetupOpts = {
          logger,
          args: ["--upgrade"],
          onMessage: (msg: ISM) => {
            this.onMessage(logger, msg);
          },
        };

        this.stage("assess");
        await runItchSetup(store, opts);
      });
    } finally {
      if (this.store.getState().broth.packages[this.name].stage === "assess") {
        this.stage("idle");
      }
    }
  }

  private onMessage(logger: Logger, msg: ISM) {
    if (msg.type === "no-update-available") {
      this.stage("idle");
    } else if (msg.type === "installing-update") {
      this.stage("download");
    } else if (msg.type === "update-failed") {
      const pp = msg.payload as ISM_UpdateFailed;
      logger.error(`Self-update failed: ${pp.message}`);
    } else if (msg.type === "update-ready") {
      const pp = msg.payload as ISM_UpdateReady;
      logger.info(`Version ${pp.version} is ready to be used.`);
      this.store.dispatch(
        actions.packageNeedRestart({
          name: this.name,
          availableVersion: pp.version,
        })
      );
    } else if (msg.type === "progress") {
      const pp = msg.payload as ISM_Progress;
      this.store.dispatch(
        actions.packageProgress({
          name: this.name,
          progressInfo: pp,
        })
      );
    } else if (msg.type === "log") {
      const pp = msg.payload as ISM_Log;
      logger.info(`> ${pp.message}`);
    }
  }

  private stage(stage: PackageState["stage"]) {
    this.store.dispatch(actions.packageStage({ name: this.name, stage }));
  }

  makeLogger(parentLogger: Logger): Logger {
    return parentLogger.childWithName(`📦 self`);
  }
}
