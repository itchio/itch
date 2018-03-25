import { Fetcher } from "./fetcher";
import { messages, withLogger } from "../butlerd";
import { Game } from "../butlerd/messages";
import getByIds from "../helpers/get-by-ids";

class CollectionFetcher extends Fetcher {
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

    const collectionId = this.space().firstPathNumber();
    const call = withLogger(this.logger);
    await call(
      messages.FetchCollection,
      {
        profileId: this.profileId(),
        collectionId,
      },
      client => {
        client.on(messages.FetchCollectionYield, async ({ collection }) => {
          const games: Game[] = [];
          for (const cg of collection.collectionGames) {
            games.push(cg.game);
          }

          this.pushCollection(collection);
          this.pushUnfilteredGames(games);
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

export default CollectionFetcher;
