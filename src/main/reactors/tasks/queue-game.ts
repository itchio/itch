import { actions } from "common/actions";
import { messages, hookLogging } from "common/butlerd";
import { Build, Game, Upload, Cave } from "common/butlerd/messages";
import { Logger } from "common/logger";
import { Store } from "common/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { makeUploadButton } from "main/reactors/make-upload-button";
import { modals } from "common/modals";
import { isEmpty, map } from "underscore";
import { promisedModal } from "main/reactors/modals";
import asTask from "main/reactors/tasks/as-task";
import { showInstallErrorModal } from "main/reactors/tasks/show-install-error-modal";

const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
  watcher.on(actions.queueGame, async (store, action) => {
    const { game, caveId } = action.payload;
    let caves: Cave[];

    if (caveId) {
      const { cave } = await mcall(messages.FetchCave, { caveId });
      if (cave) {
        caves = [cave];
      }
    } else {
      caves = (
        await mcall(messages.FetchCaves, {
          filters: { gameId: game.id },
        })
      ).items;
    }

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
        modals.naked.make({
          wind: "root",
          title: ["prompt.launch.title", { title: game.title }],
          message: ["prompt.launch.message"],
          bigButtons: map(caves, (cave) => {
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
    const { game, uploadId } = action.payload;
    await queueInstall(store, game, uploadId);
  });
}

export async function queueInstall(
  store: Store,
  game: Game,
  uploadId?: number
) {
  await asTask({
    name: "install-queue",
    gameId: game.id,
    caveId: null,
    store,
    work: async (ctx, logger) => {
      await performInstallQueue({ store, game, uploadId });
    },
    onError: async (e, log) => {
      await showInstallErrorModal({
        store,
        e,
        log,
        game,
        retryAction: () => actions.queueGameInstall({ game, uploadId }),
        stopAction: () => null,
      });
    },
    onCancel: async () => {
      store.dispatch(
        actions.statusMessage({
          message: ["status.installing_game.cancelled", { title: game.title }],
        })
      );
    },
  });
}

interface PerformInstallQueueOpts {
  store: Store;
  game: Game;
  uploadId?: number;
}

async function performInstallQueue({
  store,
  game,
  uploadId,
}: PerformInstallQueueOpts) {
  await promisedModal(
    store,
    modals.planInstall.make({
      wind: "root",
      title: game.title,
      widgetParams: {
        game,
        uploadId,
      },
      buttons: [],
    })
  );
}
