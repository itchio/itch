import { Watcher } from "../watcher";
import { DB } from "../../db";
import * as squel from "squel";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "fetch-search" });

import { actions } from "../../actions";
import { indexBy, pluck } from "underscore";
import { ISearchResults, IStore } from "../../types";
import { client } from "../../api";
import {
  mergeSearchResults,
  excludeIncompatibleSearchResults,
} from "./search-helpers";

async function doRemoteSearch(
  store: IStore,
  query: string,
  cb: (sr: ISearchResults) => void
): Promise<void> {
  const { credentials } = store.getState().session;
  if (!credentials || !credentials.key) {
    // can't do remote search
    return;
  }
  const api = client.withKey(credentials.key);

  const gamePromise = (async () => {
    const gamesRes = await api.searchGames(query);
    cb({
      games: {
        set: gamesRes.entities.games,
        ids: gamesRes.result.gameIds,
      },
    });
  })();

  const userPromise = (async () => {
    const usersRes = await api.searchUsers(query);
    cb({
      users: {
        set: usersRes.entities.users,
        ids: usersRes.result.userIds,
      },
    });
  })();

  await Promise.all([gamePromise, userPromise]);
}

function doLocalSearch(db: DB, query: string): ISearchResults {
  const equalTerm = query.toLowerCase();
  const containsTerm = `%${equalTerm}%`;
  const startTerm = `${equalTerm}%`;
  const localGames = db.games.all(k =>
    k
      .where(
        squel
          .expr()
          .or("lower(title) like ?", containsTerm)
          .or("lower(shortText) like ?", containsTerm)
      )
      .order("lower(title) = ?", true /* DESC */, equalTerm)
      .order("lower(title) like ?", true /* DESC */, startTerm)
      .limit(5)
  );

  return {
    games: { set: indexBy(localGames, "id"), ids: pluck(localGames, "id") },
  };
}

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.search, async (store, action) => {
    const query: string = action.payload.query;
    store.dispatch(actions.searchStarted({}));

    // TODO: make configurable?
    const onlyCompatible = true;

    try {
      if (!query) {
        store.dispatch(actions.searchFetched({ query: "", results: null }));
        return;
      }

      let results: ISearchResults = {};
      const push = (addition: ISearchResults) => {
        results = mergeSearchResults(results, addition);
        if (onlyCompatible) {
          results = excludeIncompatibleSearchResults(results);
        }
      };

      try {
        push(doLocalSearch(db, query));
      } catch (e) {
        logger.error(e.stack);
      }

      try {
        await doRemoteSearch(store, query, push);
      } catch (e) {
        logger.error(e.stack);
      }
      store.dispatch(actions.searchFetched({ query, results }));
    } catch (e) {
      // TODO: relay search error (network offline, etc.)
      logger.error(e.stack);
    } finally {
      store.dispatch(actions.searchFinished({}));
    }
  });
}
