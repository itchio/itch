import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "explore-cave" });

import explorer from "../../os/explorer";

import { withButlerClient, messages } from "../../buse";

export default function(watcher: Watcher) {
  watcher.on(actions.exploreCave, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await withButlerClient(logger, async client => {
      return await client.call(messages.FetchCave({ caveId }));
    });

    explorer.open(cave.installInfo.installFolder);
  });
}
