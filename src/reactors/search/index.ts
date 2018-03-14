import { Watcher } from "../watcher";

import { actions } from "../../actions";
import { call, messages } from "../../buse/index";
import { ISearchResults } from "../../types/index";
import { mergeGames, mergeUsers } from "./search-helpers";

export default function(watcher: Watcher) {
  watcher.on(actions.search, async (store, action) => {
    const profileId = store.getState().profile.credentials.me.id;
    const { query } = action.payload;
    if (query.length < 3) {
      return;
    }

    let results: ISearchResults = {};

    let dispatch = () => {
      store.dispatch(actions.searchFetched({ query, results }));
    };

    let promises = [];
    promises.push(
      call(messages.SearchGames, { profileId, query }, client => {
        // TODO: give params directly to request handlers
        client.onNotification(messages.SearchGamesYield, ({ params }) => {
          results = mergeGames(results, params.games);
          dispatch();
        });
      })
    );
    promises.push(messages.SearchUsers, { profileId, query }, client => {
      client.onNotification(messages.SearchUsers, ({ params }) => {
        results = mergeUsers(results, params.users);
        dispatch();
      });
    });

    await Promise.all(promises);
  });
}
