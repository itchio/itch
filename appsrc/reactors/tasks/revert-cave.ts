
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {getGlobalMarket} from "../market";
import {log, opts} from "./log";

import {ICaveRecord} from "../../types";

export default function (watcher: Watcher) {
  watcher.on(actions.revertCaveRequest, async (store, action) => {
    const {caveId} = action.payload;
    const market = getGlobalMarket();

    const cave = market.getEntity<ICaveRecord>("caves", caveId);
    if (!cave) {
      log(opts, `Cave not found, can't revert: ${caveId}`);
      return;
    }

    if (!cave.buildId) {
      log(opts, `Cave isn't wharf-enabled, can't revert : ${caveId}`);
      return;
    }

    store.dispatch(actions.statusMessage({
      message: `Revert cave from ${cave.buildId}: stub`,
    }));
  });
}
