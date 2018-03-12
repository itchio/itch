import { Fetcher } from "./fetcher";

import getByIds from "../helpers/get-by-ids";
import { withButlerClient, messages } from "../buse";
import { Game } from "../buse/messages";
import { uniq } from "underscore";

export default class LibraryFetcher extends Fetcher {
  async work(): Promise<void> {
    // first, filter what we already got
    const cachedGames = getByIds(
      this.space().games().set,
      this.space().games().allIds
    );
    const dataGamesCount = cachedGames.length;

    if (dataGamesCount > 0) {
      this.pushUnfilteredGames(cachedGames);
      if (!this.warrantsRemote()) {
        return;
      }
    }

    await withButlerClient(this.logger, async client => {
      client.onNotification(
        messages.FetchProfileOwnedKeysYield,
        async ({ params }) => {
          let games: Game[] = [];
          if (params.items)
            for (const dk of params.items) {
              games.push(dk.game);
            }
          games = uniq(games, g => g.id);
          this.pushUnfilteredGames(games);
        }
      );

      await client.call(
        messages.FetchProfileOwnedKeys({
          profileId: this.profileId(),
        })
      );
    });
  }

  clean() {
    this.push(
      {
        collections: null,
        users: null,
        games: null,
      },
      { shallow: true }
    );
  }
}
