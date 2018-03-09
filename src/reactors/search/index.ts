import { Watcher } from "../watcher";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "fetch-search" });

import { actions } from "../../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.search, async (store, action) => {
    logger.error("TODO: re-implement search with buse");
  });
}
