import { Watcher } from "./watcher";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "fetch-search" });

import * as actions from "../actions";

export default function(watcher: Watcher) {
  watcher.on(actions.search, async (store, action) => {
    const query: string = action.payload.query;
    store.dispatch(actions.searchStarted({}));

    try {
      if (!query) {
        store.dispatch(actions.searchFetched({ query: "", results: null }));
        return;
      }

      throw new Error(`don't know how to fetch search`);
    } catch (e) {
      // TODO: relay search error (network offline, etc.)
      logger.error(e.message);
    } finally {
      store.dispatch(actions.searchFinished({}));
    }
  });
}
