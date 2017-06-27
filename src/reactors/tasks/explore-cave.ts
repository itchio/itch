import { Watcher } from "../watcher";
import * as actions from "../../actions";

import * as sf from "../../os/sf";
import * as paths from "../../os/paths";
import explorer from "../../os/explorer";

import { DB } from "../../db";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.exploreCave, async (store, action) => {
    const { caveId } = action.payload;

    const cave = await db.caves.findOneById(caveId);
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
