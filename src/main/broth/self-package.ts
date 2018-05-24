import { PackageLike } from "./package";
import { IStore, IPackageState } from "common/types";
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
import rootLogger from "common/logger";
import { actions } from "common/actions";
const logger = rootLogger.child({ name: "self-package" });

export class SelfPackage implements PackageLike {
  private store: IStore;
  private name: string;

  constructor(store: IStore, name: string) {
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
      // TODO: figure out what to do here
      this.stage("need-restart");
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

  private stage(stage: IPackageState["stage"]) {
    this.store.dispatch(actions.packageStage({ name: this.name, stage }));
  }
}
