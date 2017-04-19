
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {startTask} from "./start-task";
import {getGlobalMarket} from "../market";
import {log, opts} from "./log";

import {ICaveRecord} from "../../types";

export default function (watcher: Watcher) {
  watcher.on(actions.configureCave, async (store, action) => {
    const {caveId} = action.payload;
    const market = getGlobalMarket();

    const cave = market.getEntity<ICaveRecord>("caves", caveId);
    if (!cave) {
      log(opts, `Cave not found, can't configure: ${caveId}`);
      return;
    }

    const taskOpts = {
      name: "configure",
      cave: cave,
      game: cave.game,
      gameId: cave.gameId,
      upload: cave.uploads[cave.uploadId],
    };

    await startTask(store, taskOpts);
  });
}
