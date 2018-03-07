import { Fetcher } from "./fetcher";
import { withButlerClient, messages } from "../buse";
import { Game } from "../buse/messages";

export default class CollectionFetcher extends Fetcher {
  async work(): Promise<void> {
    if (!this.warrantsRemote()) {
      return;
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
