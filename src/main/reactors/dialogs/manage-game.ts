import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import modals from "main/modals";
import { ManageGameParams } from "common/modals/types";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";

export default function (watcher: Watcher) {
  watcher.on(actions.manageGame, async (store, action) => {
    const { game } = action.payload;

    const caves = (
      await mcall(messages.FetchCaves, {
        filters: { gameId: game.id },
        profileId: store.getState().profile.profile?.id,
      })
    ).items;

    const widgetParams: ManageGameParams = {
      game,
      caves,
    };

    store.dispatch(
      actions.openModal(
        modals.manageGame.make({
          wind: "root",
          title: game.title,
          message: "",
          buttons: [
            {
              icon: "install",
              label: ["prompt.manage_game.install_other"],
              left: true,
              action: actions.queueGameInstall({ game }),
            },
            {
              label: ["prompt.action.close"],
              className: "secondary",
            },
          ],
          widgetParams,
        })
      )
    );
  });
}
