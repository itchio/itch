import { Fetcher } from "./fetcher";
import { map } from "underscore";
import { withButlerClient, messages } from "../buse";
import getByIds from "../helpers/get-by-ids";

export default class DashboardFetcher extends Fetcher {
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
        messages.FetchProfileGamesYield,
        async ({ params }) => {
          const games = map(params.items, i => i.game);
          this.pushUnfilteredGames(games);
        }
      );

      await client.call(
        messages.FetchProfileGames({
          profileId: this.profileId(),
        })
      );
    });
  }

  clean() {
    this.push({ games: null }, { shallow: true });
  }
}
