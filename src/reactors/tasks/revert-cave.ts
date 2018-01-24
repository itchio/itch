import { Watcher } from "../watcher";
import * as actions from "../../actions";
import { MODAL_RESPONSE } from "../../constants/action-types";

import api from "../../api";
import rootLogger from "../../logger";

import { filter } from "underscore";

import { promisedModal } from "../modals";

import getGameCredentials from "../downloads/get-game-credentials";
import lazyGetGame from "../lazy-get-game";

import { IRevertCaveParams } from "../../components/modal-widgets/revert-cave";

import { DB } from "../../db";

import asTask from "./as-task";
import { Build } from "ts-itchio-api";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.revertCaveRequest, async (store, action) => {
    const { caveId } = action.payload;

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      rootLogger.error(`Cave not found, can't revert: ${caveId}`);
      return;
    }

    if (!cave.gameId) {
      rootLogger.error(`Cave game not found, can't revert: ${cave.gameId}`);
      return;
    }

    await asTask({
      store,
      db,
      name: "install",
      gameId: cave.gameId,
      work: async (ctx, logger) => {
        // TODO: should all of this be a butler service task? (find a build to revert to)

        const game = await lazyGetGame(ctx, cave.gameId);

        const { upload } = cave;
        const currentBuild = cave.build;

        if (!upload) {
          logger.error(`No upload in cave, can't revert: ${caveId}`);
          return;
        }

        if (!currentBuild) {
          logger.error(`Upload isn't wharf-enabled, can't revert: ${caveId}`);
          return;
        }

        const gameCredentials = await getGameCredentials(ctx, game);

        const credentials = store.getState().session.credentials;
        if (!credentials) {
          logger.error(`No credentials, cannot revert to build`);
          return;
        }
        const client = api.withKey(credentials.key);
        const buildsList = await client.listBuilds(
          gameCredentials.downloadKey,
          upload.id
        );

        // TODO: figure out if we should show newer builds here as well?
        // if we do, we should show the current one as 'current' and have it be disabled
        const remoteBuilds = filter(buildsList.builds, remoteBuild => {
          return remoteBuild.id < currentBuild.id;
        });

        // FIXME: what if remoteBuilds is empty ?

        const response = await promisedModal(store, {
          title: ["prompt.revert.title", { title: game.title }],
          message: "",
          widget: "revert-cave",
          widgetParams: {
            currentCave: cave,
            game,
            remoteBuilds,
          } as IRevertCaveParams,
          buttons: ["cancel"],
        });

        if (response.type !== MODAL_RESPONSE) {
          // modal was closed
          return;
        }

        const buildId = response.payload.revertBuildId;

        let pickedBuild: Build;
        for (const b of remoteBuilds) {
          if (b.id == buildId) {
            pickedBuild = b;
          }
        }

        if (!pickedBuild) {
          throw new Error(
            `Couldn't find picked build ${buildId} in the remoteBuilds list: ${JSON.stringify(
              remoteBuilds,
              null,
              2
            )}`
          );
        }

        store.dispatch(
          actions.queueDownload({
            caveId: cave.id,
            game,
            upload,
            build: pickedBuild,
            reason: "revert",
          })
        );
      },
    });
  });
}
