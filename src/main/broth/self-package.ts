import { PackageLike } from "./package";
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
import { mainLogger } from "main/logger";
const logger = mainLogger.child(__filename);

export class SelfPackage implements PackageLike {
  private store: Store;
  private name: string;

  constructor(store: Store, name: string) {
    this.store = store;
    this.name = name;
  }

  async ensure() {
    const rs = this.store.getState();
    this.store.dispatch(
      actions.packageGotVersionPrefix({
        name: this.name,
        version: rs.system.appVersion,
        versionPrefix: rs.system.userDataPath,
      })
    );
  }

  async upgrade() {
    await itchSetupLock.with(logger, "check for self-update", async () => {
      const { store } = this;
      const opts: RunItchSetupOpts = {
        logger,
        args: ["--upgrade"],
        onMessage: this.onMessage,
      };

      this.stage("assess");
      await runItchSetup(store, opts);
    });
  }

  private onMessage = (msg: ISM) => {
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
      logger.info(`[itch-setup] ${pp.message}`);
    }
  };

  private stage(stage: PackageState["stage"]) {
    this.store.dispatch(actions.packageStage({ name: this.name, stage }));
  }
}
