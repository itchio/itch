import { Fetcher } from "./fetcher";
import { withButlerClient, messages } from "../buse";
import { Game } from "../buse/messages";
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

    await withButlerClient(this.logger, async client => {
      client.onNotification(
        messages.FetchCollectionYield,
        async ({ params }) => {
          const games: Game[] = [];
          for (const cg of params.collection.collectionGames) {
            games.push(cg.game);
          }

          this.pushCollection(params.collection);
          this.pushUnfilteredGames(games);
        }
      );

      const collectionId = this.space().firstPathNumber();
      await client.call(
        messages.FetchCollection({
          profileId: this.profileId(),
          collectionId,
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

export default CollectionFetcher;
