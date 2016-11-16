
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {getGlobalMarket} from "../market";

export default function (watcher: Watcher) {
  watcher.on(actions.implodeCave, async (store, action) => {
    const {caveId} = action.payload;

    const market = getGlobalMarket();
    await market.deleteEntity("caves", caveId, {wait: true});
  });
}
