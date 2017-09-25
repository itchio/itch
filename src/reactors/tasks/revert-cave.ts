import { Watcher } from "../watcher";
import * as actions from "../../actions";
import { MODAL_RESPONSE } from "../../constants/action-types";

import api from "../../api";
import rootLogger from "../../logger";

import { filter } from "underscore";

import { promisedModal } from "../modals";

import findUpgradePath from "../downloads/find-upgrade-path";
import getGameCredentials from "../downloads/get-game-credentials";
import lazyGetGame from "../lazy-get-game";

import { IRevertCaveParams } from "../../components/modal-widgets/revert-cave";

import { DB } from "../../db";
import { fromJSONField } from "../../db/json-field";

import asTask from "./as-task";

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
        const game = await lazyGetGame(ctx, cave.gameId);

        const upload = fromJSONField(cave.upload);
        if (!upload) {
          logger.error(`No upload in cave, can't revert: ${caveId}`);
          return;
        }

        const build = fromJSONField(cave.build);
        if (!build) {
          logger.error(`Cave isn't wharf-enabled, can't revert: ${caveId}`);
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

        logger.info(`Builds list:\n${JSON.stringify(buildsList, null, 2)}`);

        // TODO: figure out if we should show newer builds here as well?
        // if we do, we should show the current one as 'current' and have it be disabled
        const remoteBuilds = filter(buildsList.builds, remoteBuild => {
          return remoteBuild.id < build.id;
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

        try {
          // this will throw if the buildId isn't in the chain of builds of the current upload
          await findUpgradePath(ctx, {
            currentBuildId: buildId,
            game,
            gameCredentials,
            upload,
          });
        } catch (e) {
          logger.error(`Could not get upgrade path: ${e}`);
          store.dispatch(
            actions.statusMessage({
              message: e.message,
            })
          );
        }

        store.dispatch(
          actions.queueDownload({
            caveId: cave.id,
            game,
            upload,
            buildId,
            reason: "revert",
          })
        );
      },
    });
  });
}
