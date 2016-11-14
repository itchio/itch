
import * as humanize from "humanize-plus";

import pathmaker from "../../util/pathmaker";

import {log, opts} from "./log";
import {startTask} from "./start-task";
import {startDownload} from "./start-download";

import {map, where} from "underscore";

import * as actions from "../../actions";

import {IStore, IGameRecord, ICaveRecord, IUploadRecord, IDownloadKey} from "../../types";
import {IAction, IQueueGamePayload} from "../../constants/action-types";

interface IFindUploadResult {
  uploads: IUploadRecord[];
  downloadKey: IDownloadKey;
}

export async function queueGame (store: IStore, action: IAction<IQueueGamePayload>) {
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
            label: `${upload.displayName || upload.filename} (${humanize.fileSize(upload.size)})`,
            action: actions.queueGame(Object.assign({}, action.payload, {
              pickedUpload: upload.id,
            })),
            icon: "download",
          };
        }),
        buttons: [
          "cancel",
        ],
      }));
      return;
    } else {
      const upload = uploads[0];

      await startDownload(store, {
        game,
        gameId: game.id,
        upload: upload,
        handPicked: (pickedUpload != null),
        totalSize: upload.size,
        destPath: pathmaker.downloadPath(uploads[0]),
        downloadKey,
        reason: "install",
      });
    }
  } else {
    log(opts, `No uploads for ${game.title}`);
    store.dispatch(actions.openModal({
      title: ["game.install.no_uploads_available.message", {title: game.title}],
      message: ["game.install.no_uploads_available.message", {title: game.title}],
      detail: ["game.install.no_uploads_available.detail"],
      buttons: [
        {
          label: ["game.install.visit_web_page"],
          action: actions.browseGame({gameId: game.id, url: game.url}),
        },
        {
          label: ["game.install.try_again"],
          action: action,
        },
        "cancel",
      ],
    }));
  }
}

interface IExtraOpts {

}

async function startCave (store: IStore, game: IGameRecord, cave: ICaveRecord, extraOpts: IExtraOpts) {
  log(opts, `Starting cave ${cave.id}`);
  const {err} = await startTask(store, Object.assign({}, {
    name: "launch",
    gameId: cave.gameId,
    cave,
  }, extraOpts));

  if (err) {
    store.dispatch(actions.queueHistoryItem({
      label: ["game.install.could_not_launch", {title: game.title}],
      detail: (err as any).reason || ("" + err), // TODO: type properly
      options: [
        {
          label: ["game.install.visit_web_page"],
          action: actions.browseGame({gameId: game.id, url: game.url}),
        },
        {
          label: ["game.install.try_again"],
          action: actions.queueGame({game}),
        },
      ],
    }));
  }
}
