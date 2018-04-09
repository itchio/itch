import { Fetcher } from "./fetcher";

import getByIds from "common/helpers/get-by-ids";
import { messages, withLogger } from "common/butlerd";

import { Game } from "common/butlerd/messages";
import { uniq } from "underscore";

class LibraryFetcher extends Fetcher {
  async work(): Promise<void> {
    let call = withLogger(this.logger);

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

    let games: Game[] = [];

    const push = () => {
      games = uniq(games, g => g.id);
      this.pushUnfilteredGames(games);
    };

    const { caves } = await call(messages.FetchCaves, {});
    if (caves) {
      for (const cave of caves) {
        games.push(cave.game);
      }
      push();
    }

    await call(
      messages.FetchProfileOwnedKeys,
      {
        profileId: this.profileId(),
      },
      client => {
        client.on(messages.FetchProfileOwnedKeysYield, async ({ items }) => {
          if (items) {
            for (const dk of items) {
              games.push(dk.game);
            }
            push();
          }
        });
      }
    );
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

export default LibraryFetcher;
