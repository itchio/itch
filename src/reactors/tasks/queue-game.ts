
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import makeUploadButton from "../make-upload-button";

import * as paths from "../../os/paths";
import urlParser from "../../util/url";
import * as os from "../../os";
import rootLogger from "../../logger";
const logger = rootLogger.child({name: "queue-game"});
import * as querystring from "querystring";

import {startTask} from "./start-task";

import {filter, map, where} from "underscore";

import {
  IStore, IGameRecord, ICaveRecord, IUploadRecord, IDownloadKey,
} from "../../types";

interface IFindUploadResult {
  uploads: IUploadRecord[];
  downloadKey: IDownloadKey;
}

interface IExtraOpts {}

async function startCave (store: IStore, game: IGameRecord, cave: ICaveRecord, extraOpts: IExtraOpts) {
  logger.info(`Starting cave ${cave.id}`);
  await startTask(store, {
    name: "launch",
    gameId: cave.game.id,
    cave,
    logger,
    ...extraOpts,
  });
}

export default function (watcher: Watcher) {
  watcher.on(actions.queueGame, async (store, action) => {
    const {game, extraOpts = {}, pickedUpload} = action.payload;
    let {password, secret} = extraOpts;

    // FIXME: db
    const cave: any = null;
    // const cave = store.getState().globalMarket.cavesByGameId[game.id];

    if (cave) {
      logger.info(`Have a cave for game ${game.id}, launching`);
      await startCave(store, game, cave, extraOpts);
      return;
    }

    logger.info(`No cave for ${game.id}, attempting install`);

    // look for password/secret if any
    const tabData = store.getState().session.navigation.tabData;
    let pathStart = "games/${game.id}";
    for (const id of Object.keys(tabData)) {
      const data = tabData[id];
      if (data.path && data.path.indexOf(pathStart) === 0) {
        const parsed = urlParser.parse(data.path);
        const query = querystring.parse(parsed.query);
        if (query.secret) {
          secret = query.secret;
        }
        if (query.password) {
          password = query.password;
        }
      }
    }

    const uploadResponse = await startTask(store, {
      name: "find-upload",
      gameId: game.id,
      game: game,
      password,
      secret,
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

    const itchPlatform = os.itchPlatform();
    if (uploads.length > 1 && (itchPlatform === "windows" || itchPlatform === "linux")) {
      logger.info(`Got ${uploads.length} uploads, we're on ${itchPlatform}, let's sniff platforms`);

      const uploadContainsString = (upload: IUploadRecord, needle: string) => {
        return (
          ((upload.filename || "").indexOf(needle) !== -1) ||
          ((upload.displayName || "").indexOf(needle) !== -1)
        );
      };

      const anyUploadContainsString = (candidates: IUploadRecord[], needle: string): boolean => {
        for (const upload of candidates) {
          if (uploadContainsString(upload, needle)) {
            return true;
          }
        }
        return false;
      };

      let is64 = false;
      if (itchPlatform === "windows") {
        is64 = os.isWin64();
      } else if (itchPlatform === "linux") {
        is64 = os.isLinux64();
      }

      if (is64) {
        // on 64-bit, if we have 64-bit builds, exclude 32-bit builds
        if (anyUploadContainsString(uploads, "64")) {
          uploads = filter(uploads, (u) => !uploadContainsString(u, "32"));
        }
      } else {
        // on 32-bit, if there's a 32-bit build, exclude 64-bit builds
        if (anyUploadContainsString(uploads, "32")) {
          uploads = filter(uploads, (u) => !uploadContainsString(u, "64"));
        }
      }

      logger.info(`After platform sniffing, uploads look like:\n${JSON.stringify(uploads, null, 2)}`);
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
                password,
                secret,
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
          destPath: paths.downloadPath(upload, store.getState().preferences),
          downloadKey,
          reason: "install",
          password,
          secret,
        }));
      }
    } else {
      logger.warn(`No uploads for ${game.title}`);
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
