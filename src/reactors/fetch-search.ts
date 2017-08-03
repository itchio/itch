import { Watcher } from "./watcher";
import { DB } from "../db";
import * as squel from "squel";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "fetch-search" });

import * as actions from "../actions";
import { indexBy, pluck } from "underscore";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.search, async (store, action) => {
    const query: string = action.payload.query;
    store.dispatch(actions.searchStarted({}));

    try {
      if (!query) {
        store.dispatch(actions.searchFetched({ query: "", results: null }));
        return;
      }

      const equalTerm = query.toLowerCase();
      const containsTerm = `%${equalTerm}%`;
      const startTerm = `${equalTerm}%`;
      const localGames = db.games.all(k =>
        k
          .where(
            squel
              .expr()
              .or("lower(title) like ?", containsTerm)
              .or("lower(shortText) like ?", containsTerm),
          )
          .order("lower(title) = ?", true /* DESC */, equalTerm)
          .order("lower(title) like ?", true /* DESC */, startTerm)
          .limit(5),
      );
      logger.info(
        `local games results: ${JSON.stringify(localGames, null, 2)}`,
      );
      store.dispatch(
        actions.searchFetched({
          query,
          results: {
            gameResults: {
              entities: {
                games: indexBy(localGames, "id"),
              },
              result: {
                gameIds: pluck(localGames, "id"),
              },
            },
            userResults: {
              entities: {
                users: {},
              },
              result: {
                userIds: [],
              },
            },
          },
        }),
      );
    } catch (e) {
      // TODO: relay search error (network offline, etc.)
      logger.error(e.stack);
    } finally {
      store.dispatch(actions.searchFinished({}));
    }
  });
}
