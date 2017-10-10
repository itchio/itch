import { Watcher } from "../watcher";
import * as actions from "../../actions";

import Context from "../../context";
import { DB } from "../../db";

import makeUploadButton from "../make-upload-button";

import { promisedModal } from "../modals";
import { MODAL_RESPONSE } from "../../constants/action-types";

import { IUpload } from "../../types";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "queue-game" });

import findUploads, { IFindUploadResult } from "../downloads/find-uploads";
import getGameCredentials from "../downloads/get-game-credentials";

import { map } from "underscore";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.queueGame, async (store, action) => {
    const { game } = action.payload;

    const caves = db.caves.find({ gameId: game.id });

    if (caves.length > 0) {
      logger.info(
        `Have ${caves.length} caves for game ${game.title} (#${game.id}), launching the first one`
      );
      const cave = caves[0];
      store.dispatch(actions.queueLaunch({ caveId: cave.id }));
      return;
    }

    logger.info(`No cave for ${game.title} (#${game.id}), attempting install`);

    logger.warn(`Doing experimental butler install`);
    store.dispatch(
      actions.queueInstall({
        archivePath: null,
        caveId: null,
        upload: null,
        handPicked: false,
        game,
        installLocation: store.getState().preferences.defaultInstallLocation,
        reason: "install",
      })
    );
    if (1 == 1) {
      return;
    }

    const ctx = new Context(store, db);
    const gameCredentials = await getGameCredentials(ctx, game);
    if (!gameCredentials) {
      logger.error(
        `No game credentials for ${game.title} (#${game.id}), bailing out`
      );
      return;
    }

    let uploadResponse: IFindUploadResult;
    try {
      uploadResponse = await findUploads(ctx, {
        game,
        gameCredentials,
      });
    } catch (e) {
      store.dispatch(
        actions.openModal({
          title: ["prompt.install_error.title"],
          message: ["prompt.install_error.find_upload", { message: e.message }],
          buttons: [
            {
              label: ["game.install.try_again"],
              icon: "repeat",
              action: action,
            },
            "ok",
          ],
        })
      );
      return;
    }

    const { uploads } = uploadResponse;

    if (uploads.length === 0) {
      store.dispatch(
        actions.openModal({
          title: "",
          message: [
            "game.install.no_uploads_available.message",
            { title: game.title },
          ],
          detail: ["game.install.no_uploads_available.detail"],
          buttons: [
            {
              label: ["game.install.try_again"],
              icon: "repeat",
              action: action,
            },
            "ok",
          ],
        })
      );
      return;
    }

    let upload: IUpload;
    let handPicked = false;

    if (uploads.length === 1) {
      upload = uploads[0];
    } else {
      handPicked = true;
      const { title } = game;
      const modalRes = await promisedModal(store, {
        title: ["pick_install_upload.title", { title }],
        message: ["pick_install_upload.message", { title }],
        detail: ["pick_install_upload.detail"],
        bigButtons: map(uploads, candidate => {
          return {
            ...makeUploadButton(candidate),
            action: actions.modalResponse({
              pickedUpload: candidate,
            }),
          };
        }),
        buttons: ["cancel"],
      });

      if (modalRes.type === MODAL_RESPONSE) {
        upload = modalRes.payload.pickedUpload;
      } else {
        store.dispatch(actions.loginCancelled({}));
        return;
      }
    }

    store.dispatch(
      actions.queueDownload({
        game,
        upload,
        handPicked,
        totalSize: upload.size,
        reason: "install",
      })
    );
  });
}
