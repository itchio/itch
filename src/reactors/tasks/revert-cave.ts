import { Watcher } from "../watcher";
import * as actions from "../../actions";
import { MODAL_RESPONSE } from "../../constants/action-types";

import { formatDate, DATE_FORMAT } from "../../format";

import client from "../../api";
import rootLogger from "../../logger";

import { map, filter } from "underscore";

import { promisedModal } from "../modals";

import findUpgradePath from "../downloads/find-upgrade-path";
import getGameCredentials from "../downloads/get-game-credentials";
import lazyGetGame from "../lazy-get-game";

import { IRevertCaveParams } from "../../components/modal-widgets/revert-cave";

import { t } from "../../format";
import { DB } from "../../db";
import { fromJSONField } from "../../db/json-field";

import { IUpload } from "../../types";

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
        if (!cave.buildId) {
          logger.error(`Cave isn't wharf-enabled, can't revert: ${caveId}`);
          return;
        }

        const upload = fromJSONField<IUpload>(cave.upload);
        if (!cave.buildId) {
          logger.error(`No upload in cave, can't revert: ${caveId}`);
          return;
        }

        const gameCredentials = await getGameCredentials(ctx, game);

        const credentials = store.getState().session.credentials;
        if (!credentials) {
          logger.error(`No credentials, cannot revert to build`);
          return;
        }
        const keyClient = client.withKey(credentials.key);
        const buildsList = await keyClient.listBuilds(
          gameCredentials.downloadKey,
          upload.id
        );

        logger.info(`Builds list:\n${JSON.stringify(buildsList, null, 2)}`);

        const oldBuilds = filter(buildsList.builds, build => {
          return build.id < cave.buildId;
        });

        const i18n = store.getState().i18n;

        const response = await promisedModal(store, {
          title: t(i18n, ["prompt.revert.title"]),
          message: "",
          widget: "revert-cave",
          widgetParams: {
            currentCave: cave,
          } as IRevertCaveParams,
          bigButtons: map(oldBuilds, build => {
            let label = "";
            if (build.userVersion) {
              label = `${build.userVersion}`;
            } else {
              label = `#${build.id}`;
            }

            // TODO: check, I have doubts about this Date constructor
            label = `${label} — ${formatDate(
              new Date(build.updatedAt),
              i18n.lang,
              DATE_FORMAT
            )}`;

            return {
              label,
              icon: "tag",
              action: actions.modalResponse({
                revertBuildId: build.id,
              }),
            };
          }),
          buttons: [
            {
              label: t(i18n, ["prompt.revert.action.revert"]),
              icon: "checkmark",
              action: actions.modalResponse({}),
              actionSource: "widget",
            },
            "cancel",
          ],
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
          actions.statusMessage({
            message: t(i18n, ["status.reverting", { buildId }]),
          })
        );

        const changedUpload = {
          ...upload,
          buildId,
        };

        store.dispatch(
          actions.queueDownload({
            caveId: cave.id,
            game,
            upload: changedUpload,
            reason: "revert",
          })
        );
      },
    });
  });
}
