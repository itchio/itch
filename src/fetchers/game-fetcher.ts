
import {Fetcher, Outcome} from "./types";

import db from "../db";
import Game from "../db/models/game";

import normalize from "../api/normalize";
import {game} from "../api/schemas";

import {pathToId, gameToTabData} from "../util/navigation";

export default class GameFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    const {path} = this.tabData();
    const gameId = +pathToId(path);

    const gameRepo = db.getRepo(Game);
    let localGame = await gameRepo.findOneById(gameId);
    let pushGame = (game: Game) => {
      if (game) {
        this.push(gameToTabData(game));
      }
    };
    pushGame(localGame);

    const normalized = await this.withApi(async (api) => {
      return normalize(await api.game(gameId), {game});
    });

    pushGame(normalized.entities.games[normalized.result.gameId]);

    return this.success();
  }
}
