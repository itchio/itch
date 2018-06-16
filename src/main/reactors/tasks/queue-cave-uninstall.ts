import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "queue-cave-uninstall" });

import { promisedModal } from "../modals";

import asTask from "./as-task";
import { modalWidgets } from "renderer/modal-widgets";

import { performUninstall } from "../downloads/perform-uninstall";

import { withLogger, messages } from "common/butlerd";
const call = withLogger(logger);

export default function(watcher: Watcher) {
  watcher.on(actions.queueCaveUninstall, async (store, action) => {
    const { caveId } = action.payload;

    // TODO: figure if we really need that. asTask wants a gameId
    // but do we really need it? how used is asTask anyway?
    const { cave } = await call(messages.FetchCave, { caveId });

    await asTask({
      name: "uninstall",
      gameId: cave.game.id,
      store,
      work: async (ctx, logger) => {
        await performUninstall(logger, caveId);
        store.dispatch(actions.uninstallEnded({}));
      },
      onError: async (e, log) => {
        const response = await promisedModal(
          store,
          modalWidgets.showError.make({
            window: "root",
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
