import { Watcher } from "../watcher";
import { actions } from "../../actions";

import { DB } from "../../db";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.nukeCavePrereqs, async (store, action) => {
    const { caveId } = action.payload;

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      return;
    }

    db.saveOne("caves", caveId, { installedPrereqs: null });
    store.dispatch(
      actions.statusMessage({
        message: "Prereqs nuked!",
      })
    );
  });
}
