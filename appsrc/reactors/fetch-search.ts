
import {Watcher} from "./watcher";

import mklog from "../util/log";
const log = mklog("reactors/fetch");
import {opts} from "../logger";

import fetch from "../util/fetch";

import * as actions from "../actions";

export default function (watcher: Watcher) {
  watcher.on(actions.search, async (store, action) => {
    const query: string = action.payload.query;
    store.dispatch(actions.searchStarted({}));

    try {
      const credentials = store.getState().session.credentials;
      if (!credentials.key) {
        log(opts, "Not logged in, can\'t search");
        return;
      }

      if (!query) {
        log(opts, "Clearing query");
        store.dispatch(actions.searchFetched({query: "", results: null}));
        return;
      }

      const results = await fetch.search(credentials, query);
      store.dispatch(actions.searchFetched({query, results}));
    } catch (e) {
      // TODO: relay search error (network offline, etc.)
    } finally {
      store.dispatch(actions.searchFinished({}));
    }
  });
}
