import { Watcher } from "../watcher";
import { actions } from "../../actions";

import { DB } from "../../db";
import Context from "../../context";

import lazyGetGame from "../lazy-get-game";
import { modalWidgets } from "../../components/modal-widgets/index";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.viewCaveDetails, async (store, action) => {
    const { caveId } = action.payload;

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      return;
    }

    const ctx = new Context(store, db);
    const game = await lazyGetGame(ctx, cave.gameId);

    store.dispatch(
      actions.openModal(
        modalWidgets.exploreJson.make({
          title: `Cave details for ${game ? game.title : "?"}`,
          message: "Local cave data:",
          widgetParams: {
            data: cave,
          },
          buttons: [
            {
              label: ["prompt.action.ok"],
            },
            {
              label: "Nuke prereqs",
              action: actions.nukeCavePrereqs({ caveId: cave.id }),
              className: "secondary",
            },
            {
              label: "Re-configure",
              action: actions.configureCave({ caveId: cave.id }),
              className: "secondary",
            },
          ],
        })
      )
    );
  });
}
