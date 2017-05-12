
import {Fetcher, Outcome} from "./types";
import Game from "../models/game";
import client from "../util/api";

import normalize from "../util/normalize";
import {arrayOf} from "idealizr";
import {game} from "../util/schemas";

import {pluck, difference, indexBy} from "underscore";

export default class DashboardFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    const {market} = this.getMarkets();
    if (!market) {
      this.debug(`No user market :(`);
      return this.retry();
    }

    let meId: number;
    try {
      meId = this.store.getState().session.credentials.me.id;
    } catch (e) {
      this.debug(`Couldn't get meId, not logged in maybe? ${e}`);
      return this.retry();
    }

    const gameRepo = market.getRepo(Game);
    let localGames = await gameRepo.find({userId: meId});
    this.push({games: indexBy(localGames, "id")});

    const {credentials} = this.store.getState().session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    const {key} = credentials;
    const api = client.withKey(key);
    let normalized;
    try {
      this.debug(`Firing API requests...`);
      normalized = normalize(await api.myGames(), {
        games: arrayOf(game),
      });
    } catch (e) {
      this.debug(`API error:`, e);
      if (client.isNetworkError(e)) {
        return new Outcome("retry");
      } else {
        throw e;
      }
    }
    const localGameIds = pluck(localGames, "id");
    const remoteGameIds = pluck(normalized.entities.games, "id");
    this.debug(`Fetched ${Object.keys(normalized.entities.games).length} games from API`);

    await market.saveAllEntities({
      entities: {
        ...normalized.entities,
        itchAppProfile: {
          "x": {
            myGameIds: remoteGameIds,
          },
        },
      },
    });

    localGames = await gameRepo.find({userId: meId});
    this.push({games: indexBy(localGames, "id")});

    const goners = difference(localGameIds, remoteGameIds);
    if (goners.length > 0) {
      this.debug(`After /my-games, removing ${goners.length} goners: ${JSON.stringify(goners)}`)
      await market.deleteAllEntities({entities: {games: goners}});
    }

    return new Outcome("success");
  }
}
