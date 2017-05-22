
import {Watcher} from "./watcher";

import rootLogger from "../logger";
const logger = rootLogger.child({name: "fetch-search"});

import fetch from "../util/fetch";

import * as actions from "../actions";

export default function (watcher: Watcher) {
  watcher.on(actions.search, async (store, action) => {
    const query: string = action.payload.query;
    store.dispatch(actions.searchStarted({}));

    try {
      const credentials = store.getState().session.credentials;
      if (!credentials.key) {
        return;
      }

      if (!query) {
        store.dispatch(actions.searchFetched({query: "", results: null}));
        return;
      }

      const results = await fetch.search(credentials, query);
      store.dispatch(actions.searchFetched({query, results}));
    } catch (e) {
      // TODO: relay search error (network offline, etc.)
      logger.error(e.message);
    } finally {
      store.dispatch(actions.searchFinished({}));
    }
  });
}
