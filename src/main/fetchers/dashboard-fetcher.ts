import { Fetcher } from "./fetcher";
import { map } from "underscore";
import { messages, withLogger } from "common/butlerd";
import getByIds from "common/helpers/get-by-ids";

class DashboardFetcher extends Fetcher {
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

    const call = withLogger(this.logger);
    await call(
      messages.FetchProfileGames,
      {
        profileId: this.profileId(),
      },
      client => {
        client.on(messages.FetchProfileGamesYield, async ({ items }) => {
          const games = map(items, i => i.game);
          this.pushUnfilteredGames(games);
        });
      }
    );
  }

  clean() {
    this.push({ games: null }, { shallow: true });
  }
}

export default DashboardFetcher;
