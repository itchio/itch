import { Fetcher } from "./fetcher";

import { gameToTabData } from "../util/navigation";
import { actions } from "../actions/index";

export default class GameFetcher extends Fetcher {
  async work(): Promise<void> {
    const { db } = this.ctx;
    const sp = this.space();

    let isInternal = sp.internalPage() === "games";

    const gameId = isInternal ? sp.firstPathNumber() : sp.numericId();

    let localGame = db.games.findOneById(gameId);
    let pushGame = (game: typeof localGame) => {
      if (!game) {
        return;
      }

      if (isInternal) {
        isInternal = false;
        // we need to turn that into an https URL presto
        this.ctx.store.dispatch(
          actions.evolveTab({
            tab: this.tab,
            url: game.url,
            resource: `games/${gameId}`,
            replace: true,
          })
        );
      }
      this.push(gameToTabData(game));
    };
    pushGame(localGame);

    const gameRes = await this.withApi(async api => await api.game(gameId));
    pushGame(gameRes.entities.games[gameRes.result.gameId]);

    // if the game is already in the DB, we'd like to
    // update it with Fresh API Data (TM). this will also
    // save related records such as the creator of the game,
    // which is fine
    if (localGame) {
      db.saveMany(gameRes.entities);
    }
  }

  clean() {
    this.push(
      {
        users: null,
        games: null,
      },
      { shallow: true }
    );
  }
}
