import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { formatUploadTitle } from "common/format/upload";
import { Watcher } from "common/util/watcher";
import { modals } from "common/modals";
import { mcall } from "main/butlerd/mcall";

export default function (watcher: Watcher) {
  watcher.on(actions.manageCave, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await mcall(messages.FetchCave, {
      caveId,
    });

    const widgetParams = {
      cave,
    };

    const { game, upload } = cave;

    const openModal = actions.openModal(
      modals.manageCave.make({
        wind: "root",
        title: `${game.title} - ${formatUploadTitle(upload)}`,
        message: "",
        widgetParams,
      })
    );
    store.dispatch(openModal);
  });
}
