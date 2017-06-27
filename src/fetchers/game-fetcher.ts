import { Fetcher } from "./types";

import normalize from "../api/normalize";
import { game } from "../api/schemas";

import { pathToId, gameToTabData } from "../util/navigation";

export default class GameFetcher extends Fetcher {
  constructor() {
    super();
  }

  async work(): Promise<void> {
    const { db } = this.ctx;
    const { path } = this.tabData();
    const gameId = +pathToId(path);

    let localGame = await db.games.findOneById(gameId);
    let pushGame = (game: typeof localGame) => {
      if (game) {
        this.push(gameToTabData(game));
      }
    };
    pushGame(localGame);

    const normalized = await this.withApi(async api => {
      return normalize(await api.game(gameId), { game });
    });
    pushGame(normalized.entities.games[normalized.result.gameId]);
  }
}
