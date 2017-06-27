import { Watcher } from "../watcher";
import * as actions from "../../actions";

import { IViewCaveDetailsParams } from "../../components/modal-widgets/view-cave-details";
import { DB } from "../../db";
import Context from "../../context";

import lazyGetGame from "../lazy-get-game";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.viewCaveDetails, async (store, action) => {
    const { caveId } = action.payload;

    const cave = await db.caves.findOneById(caveId);
    if (!cave) {
      return;
    }

    const ctx = new Context(store, db);
    const game = await lazyGetGame(ctx, cave.gameId);

    store.dispatch(
      actions.openModal({
        title: `Cave details for ${game ? game.title : "?"}`,
        message: "",
        widget: "view-cave-details",
        widgetParams: {
          currentCave: cave,
        } as IViewCaveDetailsParams,
        buttons: [
          {
            label: ["prompt.action.ok"],
            action: actions.closeModal({}),
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
      }),
    );
  });
}
