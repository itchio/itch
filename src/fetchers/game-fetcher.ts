
import {Fetcher, Outcome} from "./types";
import Game from "../db/models/game";
import client from "../util/api";

import normalize from "../util/normalize";
import {game} from "../util/schemas";

import {pathToId} from "../util/navigation";

export default class GameFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    const {market} = this.getMarkets();
    if (!market) {
      this.debug(`No user market :(`);
      return this.retry();
    }

    const path = this.store.getState().session.navigation.tabData[this.tabId].path;
    const gameId = +pathToId(path);

    const gameRepo = market.getRepo(Game);
    let localGame = await gameRepo.findOneById(gameId);
    let pushGame = (game: Game) => {
      if (!game) {
        return;
      }
      this.push({
        games: {
          [gameId]: game,
        },
      });
    };
    pushGame(localGame);

    const {credentials} = this.store.getState().session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    const {key} = credentials;
    const api = client.withKey(key);
    let normalized;
    try {
      this.debug(`Firing API requests...`);
      normalized = normalize(await api.game(gameId), {
        game: game,
      });
    } catch (e) {
      this.debug(`API error:`, e);
      if (client.isNetworkError(e)) {
        return new Outcome("retry");
      } else {
        throw e;
      }
    }

    this.debug(`normalized: `, normalized);
    pushGame(normalized.entities.games[normalized.result.gameId]);

    return new Outcome("success");
  }
}

