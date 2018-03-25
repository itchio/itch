import { Fetcher } from "./fetcher";
import { withLogger, messages } from "../butlerd";

import { isEmpty, uniq } from "underscore";
import { Game } from "../butlerd/messages";

class LocationFetcher extends Fetcher {
  async work(): Promise<void> {
    const installLocationId = this.space().firstPathElement();

    let call = withLogger(this.logger);

    const { caves, installLocationPath, installLocationSize } = await call(
      messages.FetchCavesByInstallLocationID,
      { installLocationId }
    );

    let games: Game[] = [];
    if (!isEmpty(caves)) {
      for (const c of caves) {
        games.push(c.game);
      }
      games = uniq(games, g => g.id);
    }

    this.pushUnfilteredGames(games, { disableFilters: true });
    this.push({
      location: {
        path: installLocationPath,
        size: installLocationSize,
      },
    });
  }
}

export default LocationFetcher;
