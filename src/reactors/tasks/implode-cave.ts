import { Watcher } from "../watcher";
import * as actions from "../../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.implodeCave, async (store, action) => {
    const { caveId } = action.payload;

    // FIXME: db
    const market: any = null;
    await market.deleteEntity("caves", caveId, { wait: true });
  });
}
