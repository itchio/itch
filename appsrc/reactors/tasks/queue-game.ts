
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import makeUploadButton from "../make-upload-button";

import pathmaker from "../../util/pathmaker";

import {log, opts} from "./log";
import {startTask} from "./start-task";

import {map, where} from "underscore";

import {
  IStore, IGameRecord, ICaveRecord, IUploadRecord, IDownloadKey,
} from "../../types";

interface IFindUploadResult {
  uploads: IUploadRecord[];
  downloadKey: IDownloadKey;
}

interface IExtraOpts {}

async function startCave (store: IStore, game: IGameRecord, cave: ICaveRecord, extraOpts: IExtraOpts) {
  log(opts, `Starting cave ${cave.id}`);
  const {err} = await startTask(store, {
    name: "launch",
    gameId: cave.game.id,
    cave,
    ...extraOpts,
  });

  if (err) {
    store.dispatch(actions.queueHistoryItem({
      label: ["game.install.could_not_launch", {title: game.title}],
      detail: (err as any).reason || ("" + err), // TODO: type properly
      options: [
        {
          label: ["game.install.try_again"],
          action: actions.queueGame({game}),
        },
      ],
    }));
  }
}

export default function (watcher: Watcher) {
  watcher.on(actions.queueGame, async (store, action) => {
    const {game, extraOpts = {}, pickedUpload} = action.payload;

    const cave = store.getState().globalMarket.cavesByGameId[game.id];

    if (cave) {
      log(opts, `Have a cave for game ${game.id}, launching`);
      await startCave(store, game, cave, extraOpts);
      return;
    }

    log(opts, `No cave for ${game.id}, attempting install`);
    const uploadResponse = await startTask(store, {
      name: "find-upload",
      gameId: game.id,
      game: game,
    });

    if (uploadResponse.err) {
      store.dispatch(actions.openModal({
        title: ["prompt.install_error.title"],
        message: ["prompt.install_error.find_upload", {message: uploadResponse.err}],
        buttons: [
          {
            label: ["game.install.try_again"],
            icon: "repeat",
            action: action,
          },
          "ok",
        ],
      }));
      return;
    }

    let {uploads, downloadKey} = uploadResponse.result as IFindUploadResult;
    if (pickedUpload) {
      uploads = where(uploads, {id: pickedUpload});
    }

    if (uploads.length > 0) {
      if (uploads.length > 1) {
        const {title} = game;
        store.dispatch(actions.openModal({
          title: ["pick_install_upload.title", {title}],
          message: ["pick_install_upload.message", {title}],
          detail: ["pick_install_upload.detail"],
          bigButtons: map(uploads, (upload) => {
            return {
              ...makeUploadButton(upload),
              action: actions.queueGame({
                ...action.payload,
                pickedUpload: upload.id,
              }),
            };
          }),
          buttons: [
            "cancel",
          ],
        }));
        return;
      } else {
        const upload = uploads[0];

        store.dispatch(actions.queueDownload({
          game,
          upload: upload,
          handPicked: (pickedUpload != null),
          totalSize: upload.size,
          destPath: pathmaker.downloadPath(upload),
          downloadKey,
          reason: "install",
        }));
      }
    } else {
      log(opts, `No uploads for ${game.title}`);
      store.dispatch(actions.openModal({
        title: ["game.install.no_uploads_available.message", {title: game.title}],
        message: ["game.install.no_uploads_available.message", {title: game.title}],
        detail: ["game.install.no_uploads_available.detail"],
        buttons: [
          {
            label: ["game.install.try_again"],
            icon: "repeat",
            action: action,
          },
          "ok",
        ],
      }));
    }
  });
}
