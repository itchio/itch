import { Watcher } from "../watcher";
import { actions } from "../../actions";
import rootLogger from "../../logger";

import { promisedModal } from "../modals";

import asTask from "./as-task";
import { modalWidgets } from "../../components/modal-widgets/index";
import { withButlerClient, messages } from "../../buse";

export default function(watcher: Watcher) {
  watcher.on(actions.revertCaveRequest, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await withButlerClient(rootLogger, async client => {
      return await client.call(messages.FetchCave({ caveId }));
    });

    await asTask({
      store,
      name: "install",
      gameId: cave.game.id,
      work: async (ctx, logger) => {
        await withButlerClient(logger, async client => {
          client.onRequest(
            messages.InstallVersionSwitchPick,
            async ({ params }) => {
              const { cave, upload, builds } = params;
              const response = await promisedModal(
                store,
                modalWidgets.revertCave.make({
                  title: ["prompt.revert.title", { title: cave.game.title }],
                  message: "",
                  widgetParams: { cave, upload, builds },
                  buttons: ["cancel"],
                })
              );

              if (!response) {
                // modal was closed
                return;
              }

              return { index: -1 };
            }
          );

          await client.call(messages.InstallVersionSwitchQueue({ caveId }));
        });
      },
    });
  });
}
