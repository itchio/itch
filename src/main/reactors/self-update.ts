import { Watcher } from "common/util/watcher";

import * as os from "../os";

import urls from "common/constants/urls";
import ospath from "path";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "self-update" });
import {
  formatDate,
  DATE_FORMAT,
  formatDuration,
} from "common/format/datetime";

import { actions } from "common/actions";
import { t } from "common/format/t";
import { IStore } from "common/types";
import { manager } from "./setup";
import { modalWidgets } from "renderer/components/modal-widgets";
import spawn from "../os/spawn";
import { MinimalContext } from "../context";
import env from "common/env";
import { fileSize } from "common/format/filesize";

// 2 hours, * 60 = minutes, * 60 = seconds, * 1000 = millis
const UPDATE_INTERVAL = 2 * 60 * 60 * 1000;
const UPDATE_INTERVAL_WIGGLE = 0.2 * 60 * 60 * 1000;

export default function(watcher: Watcher) {
  watcher.on(actions.tick, async (store, action) => {
    const { nextSelfUpdateCheck } = store.getState().systemTasks;

    if (Date.now() < nextSelfUpdateCheck) {
      // not our time!
      return;
    }

    const sleepTime = UPDATE_INTERVAL + Math.random() + UPDATE_INTERVAL_WIGGLE;
    store.dispatch(
      actions.scheduleSystemTask({
        nextSelfUpdateCheck: Date.now() + sleepTime,
      })
    );

    store.dispatch(actions.checkForSelfUpdate({}));
  });

  watcher.on(actions.checkForSelfUpdate, async (store, action) => {
    logger.info("Checking...");
    await Promise.all([checkForSelfUpdate(store), checkForComponentsUpdate()]);
  });

  watcher.on(actions.applySelfUpdateRequest, async (store, action) => {
    const i18n = store.getState().i18n;
    const spec = store.getState().selfUpdate.downloaded;
    if (!spec) {
      logger.warn(
        "Asked to apply update, but nothing downloaded? bailing out..."
      );
      return;
    }

    // TODO: is this correct?
    const pubDate = new Date(spec.pub_date);

    store.dispatch(
      actions.openModal(
        modalWidgets.naked.make({
          title: ["prompt.self_update_ready.title", { version: spec.name }],
          message: [
            "prompt.self_update_ready.message",
            {
              restart: t(i18n, ["prompt.self_update_ready.action.restart"]),
            },
          ],
          detail: [
            "prompt.self_update_ready.detail",
            {
              notes: spec.notes,
              pubDate: formatDate(pubDate, i18n.lang, DATE_FORMAT),
            },
          ],
          buttons: [
            {
              label: ["prompt.self_update_ready.action.restart"],
              action: actions.applySelfUpdate({}),
              icon: "repeat",
            },
            {
              label: ["prompt.self_update_ready.action.snooze"],
              action: actions.snoozeSelfUpdate({}),
              className: "secondary",
            },
          ],
          widgetParams: null,
        })
      )
    );
  });

  watcher.on(actions.applySelfUpdate, async (store, action) => {
    logger.info("Preparing for restart...");
    store.dispatch(actions.quitAndInstall({}));
  });

  watcher.on(actions.selfUpdateError, async (store, action) => {
    const error = action.payload;
    logger.error(`Self-updater barfed: ${error.message}`);
  });

  watcher.on(actions.showAvailableSelfUpdate, async (store, action) => {
    const spec = store.getState().selfUpdate.available;
    if (!spec) {
      logger.warn("Asked to show available self-update but there wasn't any");
      store.dispatch(actions.dismissStatus({}));
      return;
    }
    const pubDate = new Date(spec.pub_date);
    const lang = store.getState().i18n.lang;

    const messageString = `prompt.self_update.message.${os.itchPlatform()}`;

    store.dispatch(
      actions.openModal(
        modalWidgets.naked.make({
          title: ["prompt.self_update.title", { version: spec.name }],
          message: [messageString],
          detail: [
            "prompt.self_update.detail",
            {
              notes: spec.notes,
              pubDate: formatDate(pubDate, lang, DATE_FORMAT),
            },
          ],
          buttons: [
            {
              label: ["prompt.self_update.action.download"],
              action: [
                actions.openInExternalBrowser({ url: spec.url }),
                actions.dismissStatus({}),
              ],
              icon: "download",
            },
            {
              label: ["prompt.self_update.action.view"],
              action: [
                actions.openInExternalBrowser({ url: urls.releasesPage }),
                actions.dismissStatus({}),
              ],
              className: "secondary",
              icon: "earth",
            },
            {
              label: ["prompt.self_update.action.dismiss"],
              action: actions.dismissStatus({}),
              className: "secondary",
            },
          ],
          widgetParams: null,
        })
      )
    );
  });

  watcher.on(actions.viewChangelog, async (store, action) => {
    // TODO: re-implement me
  });
}

async function checkForComponentsUpdate() {
  await manager.upgrade();
}

const itchSetupLock = {
  reason: null as string,
  async with(reason: string, f: () => Promise<void>): Promise<boolean> {
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

async function checkForSelfUpdate(store: IStore) {
  await itchSetupLock.with("check for self-update", async () => {
    const rs = store.getState();
    const pkg = rs.broth.packages["itch-setup"];
    if (pkg.stage !== "idle") {
      logger.warn(
        `Cancelling self-update check, wanted pkg stage idle but got '${
          pkg.stage
        }'`
      );
      return;
    }

    const prefix = pkg.versionPrefix;
    if (!prefix) {
      logger.warn(
        `Cancelligns elf-update check, no prefix for itch-setup (not installed yet?)`
      );
      return;
    }

    await spawn({
      ctx: new MinimalContext(),
      logger: logger.child({ name: "itch-setup upgrade" }),
      command: ospath.join(prefix, "itch-setup"),
      args: ["--upgrade", "--appname", env.appName],
      onErrToken: (tok: string) => {
        try {
          const msg = JSON.parse(tok) as ISM;
          logger.info(`Got JSON token: ${JSON.stringify(msg, null, 2)}`);

          if (msg.type === "no-update-available") {
            store.dispatch(
              actions.selfUpdateNotAvailable({
                uptodate: true,
              })
            );
          } else if (msg.type === "installing-update") {
            const pp = msg.payload as ISM_InstallingUpdate;
            store.dispatch(
              actions.selfUpdateAvailable({
                downloading: true,
                spec: {
                  name: pp.version,
                  notes: "<no notes>",
                  pub_date: "",
                  url: "https://itch.io/app",
                },
              })
            );
          } else if (msg.type === "update-failed") {
            const pp = msg.payload as ISM_UpdateFailed;
            store.dispatch(
              actions.selfUpdateError({
                message: pp.message,
              })
            );
          } else if (msg.type === "update-ready") {
            const pp = msg.payload as ISM_UpdateReady;
            logger.info(`Version ${pp.version} is ready to be used.`);
            store.dispatch(actions.selfUpdateDownloaded({}));
          } else if (msg.type === "progress") {
            const pp = msg.payload as ISM_Progress;
            // TODO: commit to state
            logger.info(
              `Self-update progress: ${(100 * pp.progress).toFixed(
                2
              )}%, ETA ${formatDuration(pp.eta)} @ ${fileSize(pp.bps)} / s`
            );
          } else if (msg.type === "log") {
            const pp = msg.payload as ISM_Log;
            logger.info(`Self-update log message: ${pp.message}`);
          }
        } catch (e) {
          logger.warn(`While parsing JSON line "${tok}": ${e}`);
        }
      },
    });
  });
}

//

interface ISM {
  type:
    | "log"
    | "progress"
    | "installing-update"
    | "update-ready"
    | "no-update-available"
    | "update-failed";
  payload: any;
}

interface ISM_Log {
  level: string;
  message: string;
}

interface ISM_Progress {
  progress: number;
  bps: number;
  eta: number;
}

interface ISM_InstallingUpdate {
  version: string;
}

interface ISM_UpdateReady {
  version: string;
}

interface ISM_UpdateFailed {
  message: string;
}
