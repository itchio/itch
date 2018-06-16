import { Watcher } from "common/util/watcher";

import { actions } from "common/actions";
import { call, messages } from "common/butlerd/index";
import { mergeGames, mergeUsers } from "./search-helpers";

import { filter, sortBy } from "underscore";
import { SearchResults } from "common/types";
import { isPlatformCompatible } from "common/util/is-platform-compatible";

export default function(watcher: Watcher) {
  watcher.on(actions.search, async (store, action) => {
    const oldQuery = store.getState().profile.search.query;

    const query = action.payload.query.trim();

    if (query.length === 0) {
      // clear search
      store.dispatch(actions.searchFetched({ query: "", results: {} }));
    }

    if (oldQuery === action.payload.query) {
      // already fetched, nevermind
      return;
    }

    store.dispatch(actions.searchStarted({}));
    try {
      const profileId = store.getState().profile.credentials.me.id;

      let results: SearchResults = {};

      let dispatch = () => {
        store.dispatch(actions.searchFetched({ query, results }));
      };

      let promises = [];
      promises.push(
        call(messages.SearchGames, { profileId, query }, client => {
          // TODO: give params directly to request handlers
          client.onNotification(messages.SearchGamesYield, ({ params }) => {
            let games = filter(params.games, g => isPlatformCompatible(g));
            games = sortBy(games, g => getEditDistance(query, g.title));

            results = mergeGames(results, games);
            dispatch();
          });
        })
      );
      promises.push(
        call(messages.SearchUsers, { profileId, query }, client => {
          client.onNotification(messages.SearchUsersYield, ({ params }) => {
            results = mergeUsers(results, params.users);
            dispatch();
          });
        })
      );

      await Promise.all(promises);
    } finally {
      store.dispatch(actions.searchFinished({}));
    }
  });
}

/*
Copyright (c) 2011 Andrei Mackenzie
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// Compute the edit distance between the two given strings
function getEditDistance(a: string, b: string): number {
  if (a.length == 0) return b.length;
  if (b.length == 0) return a.length;

  var matrix = [];

  // increment along the first column of each row
  var i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1
          )
        ); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
}
