
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {getGlobalMarket} from "../market";
import {log, opts} from "./log";

import {ICaveRecord} from "../../types";

export default function (watcher: Watcher) {
  watcher.on(actions.nukeCavePrereqs, async (store, action) => {
    const {caveId} = action.payload;
    const market = getGlobalMarket();

    const cave = market.getEntity<ICaveRecord>("caves", caveId);
    if (!cave) {
      log(opts, `Cave not found, can't nuke prereqs: ${caveId}`);
      return;
    }

    await market.saveEntity("caves", caveId, {installedPrereqs: null});
    store.dispatch(actions.statusMessage({
      message: "Prereqs nuked!",
    }));
  });
}
