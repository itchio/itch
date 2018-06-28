import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import rootLogger from "common/logger";
import { messages, withLogger } from "common/butlerd/index";
import { formatUploadTitle } from "common/format/upload";
import { modalWidgets } from "renderer/modal-widgets";
const logger = rootLogger.child({ name: "manage-game" });
const call = withLogger(logger);

export default function(watcher: Watcher) {
  watcher.on(actions.manageCave, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await call(messages.FetchCave, {
      caveId,
    });

    const widgetParams = {
      cave,
    };

    const { game, upload } = cave;

    const openModal = actions.openModal(
      modalWidgets.manageCave.make({
        wind: "root",
        title: `${game.title} - ${formatUploadTitle(upload)}`,
        message: "",
        widgetParams,
      })
    );
    store.dispatch(openModal);
  });
}
