import { Watcher } from "../watcher";
import { DB } from "../../db";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "fetch-search" });

import { actions } from "../../actions";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.search, async (store, action) => {
    logger.error("TODO: re-implement search with buse");
  });
}
