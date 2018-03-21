import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "queue-cave-uninstall" });

import { promisedModal } from "../modals";

import asTask from "./as-task";
import { modalWidgets } from "../../components/modal-widgets/index";

import { performUninstall } from "../downloads/perform-uninstall";

import { withLogger, messages } from "../../buse";
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
