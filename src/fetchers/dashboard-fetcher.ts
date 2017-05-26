
import {Fetcher, Outcome} from "./types";

import db from "../db";
import Game from "../db/models/game";

import client from "../api";
import normalize from "../api/normalize";
import {game, arrayOf} from "../api/schemas";
import {isNetworkError} from "../net/errors";

import {pluck, difference, indexBy, each} from "underscore";

export default class DashboardFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    let meId: number;
    try {
      meId = this.store.getState().session.credentials.me.id;
    } catch (e) {
      this.debug(`Couldn't get meId, not logged in maybe? ${e}`);
      return this.retry();
    }

    const gameRepo = db.getRepo(Game);
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
      if (isNetworkError(e)) {
        return new Outcome("retry");
      } else {
        throw e;
      }
    }
    const localGameIds = pluck(localGames, "id");
    const remoteGameIds = pluck(normalized.entities.games, "id");
    this.debug(`Fetched ${Object.keys(normalized.entities.games).length} games from API`);

    // FIXME: once the API is cleaned up, this will be unnecessary
    each(normalized.entities.games, (game: Game) => {
      if (!game.userId) {
        game.userId = meId;
      }
    });

    await db.saveAllEntities({
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
      await db.deleteAllEntities({entities: {games: goners}});
    }

    return new Outcome("success");
  }
}
