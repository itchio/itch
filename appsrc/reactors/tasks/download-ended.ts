
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {startTask} from "./start-task";
import {startDownload} from "./start-download";
import {log, opts} from "./log";

import {omit} from "underscore";

import localizer from "../../localizer";

export default function (watcher: Watcher) {
  watcher.on(actions.downloadEnded, async (store, action) => {
    const {downloadOpts} = action.payload;
    let {err} = action.payload;

    const {reason, incremental} = downloadOpts;
    if (reason === "install" || reason === "update") {
      if (err) {
        if (incremental) {
          log(opts, "Incremental didn\'t work, doing full download");
          const newDownloadOpts = Object.assign({}, omit(downloadOpts, "upgradePath", "incremental"), {
            totalSize: downloadOpts.upload.size,
          });
          await startDownload(store, newDownloadOpts);
        } else {
          log(opts, "Download had an error, should notify user");
        }
      } else {
        if (incremental) {
          // all good
          return;
        }
        log(opts, "Download finished, installing..");

        const taskOpts = {
          name: "install",
          gameId: downloadOpts.gameId,
          game: downloadOpts.game,
          upload: downloadOpts.upload,
          archivePath: downloadOpts.destPath,
          downloadKey: downloadOpts.downloadKey,
          handPicked: downloadOpts.handPicked,
        };

        const {err: installErr} = await startTask(store, taskOpts);
        if (installErr) {
          log(opts, `Error in install: ${installErr}`);
          return;
        }

        const prefs = store.getState().preferences || {readyNotification: true};
        const {readyNotification} = prefs;

        if (readyNotification) {
          const i18n = store.getState().i18n;
          const t = localizer.getT(i18n.strings, i18n.lang);
          const message = t(
            reason === "install"
            ? "notification.download_installed"
            : "notification.download_updated"
            , {title: downloadOpts.game.title}
          );
          store.dispatch(actions.notify({
            body: message,
            onClick: actions.navigateToGame(downloadOpts.game),
          }));
        }
      }
    } else {
      log(opts, `Downloaded something for reason ${reason}`);
    }
  });
}
