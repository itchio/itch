
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import sf from "../../util/sf";
import pathmaker from "../../util/pathmaker";
import explorer from "../../util/explorer";

import {getGlobalMarket} from "../market";
import {log, opts} from "./log";

import {ICaveRecord} from "../../types";

export default function (watcher: Watcher) {
  watcher.on(actions.exploreCave, async (store, action) => {
    const {caveId} = action.payload;
    const market = getGlobalMarket();

    const cave = market.getEntity<ICaveRecord>("caves", caveId);
    if (!cave) {
      log(opts, `Cave not found, can't explore: ${caveId}`);
      return;
    }
    const appPath = pathmaker.appPath(cave, store.getState().preferences);

    const exists = await sf.exists(appPath);
    if (exists) {
      explorer.open(appPath);
    } else {
      store.dispatch(actions.probeCave(action.payload));
    }
  });
}
