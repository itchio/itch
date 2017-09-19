import { Fetcher } from "./fetcher";

import normalize from "../api/normalize";
import { game } from "../api/schemas";

import { gameToTabData } from "../util/navigation";

export default class GameFetcher extends Fetcher {
  async work(): Promise<void> {
    const { db } = this.ctx;
    const gameId = this.space().numericId();

    let localGame = db.games.findOneById(gameId);
    let pushGame = (game: typeof localGame) => {
      if (game) {
        this.push(gameToTabData(game));
      }
    };
    pushGame(localGame);

    const normalized = await this.withApi(async api => {
      const apiGame = await api.game(gameId);
      return normalize(apiGame, { game });
    });

    pushGame(normalized.entities.games[normalized.result.gameId]);

    // if the game is already in the DB, we'd like to
    // update it with Fresh API Data (TM). this will also
    // save related records such as the creator of the game,
    // which is fine
    if (localGame) {
      db.saveMany(normalized.entities);
    }
  }
}
