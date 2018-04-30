import { Watcher } from "common/util/watcher";

import * as os from "../os";

import urls from "common/constants/urls";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "self-update" });
import { formatDate, DATE_FORMAT } from "common/format/datetime";

import { actions } from "common/actions";
import { t } from "common/format/t";
import { IStore } from "common/types";
import { manager } from "./setup";
import { modalWidgets } from "renderer/components/modal-widgets";

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

async function checkForSelfUpdate(store: IStore) {
  // TODO: re-implement
  store.dispatch(actions.selfUpdateNotAvailable({ uptodate: true }));
}
