import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger, { Logger } from "../../logger";
const logger = rootLogger.child({ name: "queue-game" });

import asTask from "./as-task";

import { IStore } from "../../types/index";
import { Game, Upload, Build } from "../../buse/messages";

import { map, isEmpty } from "underscore";
import makeUploadButton from "../make-upload-button";
import { modalWidgets } from "../../components/modal-widgets/index";
import { withButlerClient, messages } from "../../buse";
import { promisedModal } from "../modals";

export default function(watcher: Watcher) {
  watcher.on(actions.queueGame, async (store, action) => {
    const { game } = action.payload;
    const { caves } = await withButlerClient(
      logger,
      async client =>
        await client.call(messages.FetchCavesByGameID({ gameId: game.id }))
    );

    if (isEmpty(caves)) {
      logger.info(
        `No cave for ${game.title} (#${game.id}), attempting install`
      );
      await queueInstall(store, game);
      return;
    }

    logger.info(
      `Have ${caves.length} caves for game ${game.title} (#${game.id})`
    );

    if (caves.length === 1) {
      const cave = caves[0];
      store.dispatch(actions.queueLaunch({ cave }));
      return;
    }

    store.dispatch(
      actions.openModal(
        modalWidgets.naked.make({
          title: ["prompt.launch.title", { title: game.title }],
          message: ["prompt.launch.message"],
          bigButtons: map(caves, cave => {
            return {
              ...makeUploadButton(cave.upload),
              action: actions.queueLaunch({ cave }),
            };
          }),
          buttons: ["cancel"],
          widgetParams: null,
        })
      )
    );
  });

  watcher.on(actions.queueGameInstall, async (store, action) => {
    const { game, upload } = action.payload;
    await queueInstall(store, game, upload);
  });
}

export async function queueInstall(
  store: IStore,
  game: Game,
  upload?: Upload,
  build?: Build
) {
  await asTask({
    name: "install-queue",
    gameId: game.id,
    store,
    work: async (ctx, logger) => {
      await performInstallQueue({ store, logger, game, upload, build });
    },
    onError: async (e, log) => {
      store.dispatch(
        actions.openModal(
          modalWidgets.showError.make({
            title: ["prompt.install_error.title"],
            message: e.message,
            coverUrl: game.coverUrl,
            stillCoverUrl: game.stillCoverUrl,
            bigButtons: [
              {
                label: ["game.install.try_again"],
                action: actions.queueGameInstall({
                  game,
                  upload,
                }),
                icon: "repeat",
                tags: [{ label: "One never knows.." }],
              },
              "cancel",
            ],
            widgetParams: { rawError: e, log },
          })
        )
      );
    },
  });
}

async function performInstallQueue({
  store,
  logger,
  game,
  upload,
  build,
}: {
  store: IStore;
  logger: Logger;
  game: Game;
  upload: Upload;
  build: Build;
}) {
  await withButlerClient(logger, async client => {
    client.onRequest(messages.PickUpload, async ({ params }) => {
      const { uploads } = params;
      const { title } = game;

      const modalRes = await promisedModal(
        store,
        modalWidgets.pickUpload.make({
          title: ["pick_install_upload.title", { title }],
          message: ["pick_install_upload.message", { title }],
          coverUrl: game.coverUrl,
          stillCoverUrl: game.stillCoverUrl,
          bigButtons: map(uploads, (candidate, index) => {
            return {
              ...makeUploadButton(candidate),
              action: modalWidgets.pickUpload.action({
                pickedUploadIndex: index,
              }),
            };
          }),
          buttons: ["cancel"],
          widgetParams: {},
        })
      );

      if (modalRes) {
        return { index: modalRes.pickedUploadIndex };
      } else {
        // that tells butler to abort
        return { index: -1 };
      }
    });

    client.onRequest(messages.ExternalUploadsAreBad, async ({ params }) => {
      const modalRes = await promisedModal(
        store,
        modalWidgets.naked.make({
          title: "Dragons be thar",
          message:
            "You've chosen to install an external upload. Those are supported poorly.",
          detail:
            "There's a chance it won't install at all.\n\nAlso, we won't be able to check for updates.",
          bigButtons: [
            {
              label: "Install it anyway",
              tags: [{ label: "Consequences be damned" }],
              icon: "fire",
              action: actions.modalResponse({}),
            },
            "nevermind",
          ],
          widgetParams: null,
        })
      );

      if (!modalRes) {
        return { whatever: false };
      }

      // ahh damn.
      return { whatever: true };
    });

    const installLocationId = defaultInstallLocation(store);

    await client.call(
      messages.InstallQueue({
        game,
        upload,
        build,
        installLocationId,
        queueDownload: true,
      })
    );
    store.dispatch(actions.downloadQueued({}));
  });
}

function defaultInstallLocation(store: IStore) {
  const { defaultInstallLocation } = store.getState().preferences;
  return defaultInstallLocation;
}
