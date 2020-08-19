import { actions } from "common/actions";
import { messages, hookLogging, hookProgress } from "common/butlerd";
import { Watcher } from "common/util/watcher";
import { mainLogger } from "main/logger";
import { modals } from "common/modals";
import { performUninstall } from "main/reactors/downloads/perform-uninstall";
import { promisedModal } from "main/reactors/modals";
import asTask from "main/reactors/tasks/as-task";
import { mcall } from "main/butlerd/mcall";

const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
  watcher.on(actions.queueCaveUninstall, async (store, action) => {
    const { caveId } = action.payload;

    // TODO: figure if we really need that. asTask wants a gameId
    // but do we really need it? how used is asTask anyway?
    const { cave } = await mcall(messages.FetchCave, { caveId });

    await asTask({
      name: "uninstall",
      gameId: cave.game.id,
      caveId,
      store,
      work: async (ctx, logger) => {
        await mcall(messages.UninstallPerform, { caveId }, (convo) => {
          hookProgress(convo, ctx);
          hookLogging(convo, logger.child(__filename));

          convo.onNotification(
            messages.TaskStarted,
            async ({ type, reason }) => {
              logger.info(`Task ${type} started (for ${reason})`);
            }
          );

          convo.onNotification(messages.TaskSucceeded, async ({ type }) => {
            logger.info(`Task ${type} succeeded`);
          });
        });
        logger.info(`Uninstall successful`);

        store.dispatch(actions.uninstallEnded({}));
      },
      onError: async (e, log) => {
        const response = await promisedModal(
          store,
          modals.showError.make({
            wind: "root",
            title: ["prompt.uninstall_error.title"],
            message: ["prompt.uninstall_error.message"],
            buttons: [
              {
                label: ["prompt.action.ok"],
                action: actions.modalResponse({}),
              },
              "cancel",
            ],
            widgetParams: { rawError: e, log },
          })
        );

        if (!response) {
          // modal was closed
          return;
        }

        logger.info(`Should remove entry anyway, performing hard uninstall`);
        try {
          await mcall(messages.UninstallPerform, { caveId, hard: true });
          store.dispatch(actions.uninstallEnded({}));
        } catch (e) {
          logger.error(`Well, even hard uninstall didn't work: ${e.stack}`);
        }
      },
    });
  });
}
