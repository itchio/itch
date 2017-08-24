import { Watcher } from "../watcher";
import * as actions from "../../actions";

import { IExploreJsonParams } from "../../components/modal-widgets/explore-json";
import { DB } from "../../db";
import { CaveModel } from "../../db/models/cave";
import expandFields from "../../db/expand-fields";
import Context from "../../context";

import lazyGetGame from "../lazy-get-game";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.viewCaveDetails, async (store, action) => {
    const { caveId } = action.payload;

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      return;
    }
    expandFields(cave, CaveModel);

    const ctx = new Context(store, db);
    const game = await lazyGetGame(ctx, cave.gameId);

    store.dispatch(
      actions.openModal({
        title: `Cave details for ${game ? game.title : "?"}`,
        message: "Local cave data:",
        widget: "explore-json",
        widgetParams: {
          data: cave,
        } as IExploreJsonParams,
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
      })
    );
  });
}
