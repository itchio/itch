import { Watcher } from "../watcher";
import { DB } from "../../db";
import * as squel from "squel";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "fetch-search" });

import * as actions from "../../actions";
import { indexBy, pluck } from "underscore";
import { ISearchResults, IStore } from "../../types";
import { client } from "../../api";
import {
  mergeSearchResults,
  excludeIncompatibleSearchResults,
} from "./search-helpers";
import normalize from "../../api/normalize";
import { arrayOf, game, user } from "../../api/schemas";

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
    const apiResponse = await api.searchGames(query);
    const result = normalize(apiResponse, { games: arrayOf(game) });
    cb({
      games: {
        set: result.entities.games,
        ids: result.result.gameIds,
      },
    });
  })();

  const userPromise = (async () => {
    const apiResponse = await api.searchUsers(query);
    const result = normalize(apiResponse, { users: arrayOf(user) });
    cb({
      users: {
        set: result.entities.users,
        ids: result.result.userIds,
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
        await doRemoteSearch(store, query, push);
      } catch (e) {
        logger.error(e.stack);
      }

      try {
        push(doLocalSearch(db, query));
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
