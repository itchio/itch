import { actions } from "common/actions";
import { messages, callFromStore } from "common/butlerd";
import { Watcher } from "common/util/watcher";
import { mainLogger } from "main/logger";
import { modals } from "common/modals";
import { performUninstall } from "../downloads/perform-uninstall";
import { promisedModal } from "../modals";
import asTask from "./as-task";

const logger = mainLogger.child(__filename);

export default function(watcher: Watcher) {
  watcher.on(actions.queueCaveUninstall, async (store, action) => {
    const call = callFromStore(store, logger);
    const { caveId } = action.payload;

    // TODO: figure if we really need that. asTask wants a gameId
    // but do we really need it? how used is asTask anyway?
    const { cave } = await call(messages.FetchCave, { caveId });

    await asTask({
      name: "uninstall",
      gameId: cave.game.id,
      store,
      work: async (ctx, logger) => {
        await performUninstall(store, logger, caveId);
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
      },
    });
  });
}
