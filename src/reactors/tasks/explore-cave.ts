
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import sf from "../../os/sf";
import * as paths from "../../os/paths";
import explorer from "../../os/explorer";

export default function (watcher: Watcher) {
  watcher.on(actions.exploreCave, async (store, action) => {
    const {caveId} = action.payload;
    // FIXME: db
    const market: any = null;

    const cave = market.getEntity("caves", caveId);
    if (!cave) {
      return;
    }
    const appPath = paths.appPath(cave, store.getState().preferences);

    const exists = await sf.exists(appPath);
    if (exists) {
      explorer.open(appPath);
    } else {
      store.dispatch(actions.probeCave(action.payload));
    }
  });
}
