import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "revert-cave" });

import { promisedModal } from "../modals";

import asTask from "./as-task";
import { modalWidgets } from "renderer/modal-widgets";

import { withLogger, messages } from "common/butlerd";
const call = withLogger(logger);

export default function(watcher: Watcher) {
  watcher.on(actions.switchVersionCaveRequest, async (store, action) => {
    const { cave } = action.payload;

    await asTask({
      store,
      name: "install",
      gameId: cave.game.id,
      work: async (ctx, logger) => {
        await call(
          messages.InstallVersionSwitchQueue,
          { caveId: cave.id },
          client => {
            client.on(
              messages.InstallVersionSwitchPick,
              async ({ cave, upload, builds }) => {
                const response = await promisedModal(
                  store,
                  modalWidgets.switchVersionCave.make({
                    window: "root",
                    title: ["prompt.revert.title", { title: cave.game.title }],
                    message: "",
                    widgetParams: { cave, upload, builds },
                    buttons: ["cancel"],
                  })
                );

                if (!response) {
                  // modal was closed
                  return { index: -1 };
                }

                return { index: response.index };
              }
            );
          }
        );
      },
    });
  });
}
