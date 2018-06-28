import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { modals } from "common/modals";
import { promisedModal } from "../modals";
import asTask from "./as-task";

export default function(watcher: Watcher) {
  watcher.on(actions.switchVersionCaveRequest, async (store, action) => {
    const { cave } = action.payload;

    await asTask({
      store,
      name: "install",
      gameId: cave.game.id,
      work: async (ctx, logger) => {
        await mcall(
          messages.InstallVersionSwitchQueue,
          { caveId: cave.id },
          client => {
            client.on(
              messages.InstallVersionSwitchPick,
              async ({ cave, upload, builds }) => {
                const response = await promisedModal(
                  store,
                  modals.switchVersionCave.make({
                    wind: "root",
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
