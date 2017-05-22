
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {startTask} from "./start-task";

import rootLogger from "../../logger";
const logger = rootLogger.child({name: "configure-cave"});

export default function (watcher: Watcher) {
  watcher.on(actions.configureCave, async (store, action) => {
    const {caveId} = action.payload;
    // FIXME: db
    const market: any = null;

    const cave = market.getEntity("caves", caveId);
    if (!cave) {
      logger.warn(`Cave not found, can't configure: ${caveId}`);
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
