import { Watcher } from "../watcher";
import * as actions from "../../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.nukeCavePrereqs, async (store, action) => {
    const { caveId } = action.payload;
    // FIXME: db
    const market: any = null;

    const cave = market.getEntity("caves", caveId);
    if (!cave) {
      return;
    }

    await market.saveOne("caves", caveId, { installedPrereqs: null });
    store.dispatch(
      actions.statusMessage({
        message: "Prereqs nuked!",
      }),
    );
  });
}
