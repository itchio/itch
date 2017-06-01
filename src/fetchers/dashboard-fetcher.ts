
import {Fetcher, Outcome} from "./types";

import db from "../db";
import Game from "../db/models/game";
import Profile from "../db/models/profile";

import normalize from "../api/normalize";
import {game, arrayOf} from "../api/schemas";

import {addFilterAndSortToQuery} from "./sort-and-filter";

import {pluck, indexBy} from "underscore";

const emptyArr = [];

export default class DashboardFetcher extends Fetcher {

  async work(): Promise<Outcome> {
    await this.pushLocal();

    if (this.warrantsRemote(this.reason)) {
      await this.remote();
      await this.pushLocal();
    }

    return this.success();
  }

  async pushLocal () {
    const profileRepo = db.getRepo(Profile);
    const gameRepo = db.getRepo(Game);

    const meId = this.ensureCredentials().me.id;    
    const profile = await profileRepo.findOneById(meId);
    if (!profile) {
      return;
    }
    const myGameIds = profile.myGameIds || emptyArr;

    let query = gameRepo.createQueryBuilder("games");

    query.where("games.id in (:gameIds)");
    query.addParameters({ gameIds: myGameIds });
    const totalCount = myGameIds.length;

    addFilterAndSortToQuery(query, this.tabId, this.store);

    const [games, gamesCount] = await query.getManyAndCount();

    this.push({
      games: indexBy(games, "id"),
      gameIds: pluck(games, "id"),
      gamesCount,
      gamesOffset: 0,
      hiddenCount: totalCount - gamesCount,
    });
  }

  async remote () {
    const apiResponse = await this.withApi(async (api) => {
      return await api.myGames();
    });

    const normalized = normalize(apiResponse, {
      games: arrayOf(game),
    });
    const meId = this.ensureCredentials().me.id;    

    const remoteGameIds = pluck(normalized.entities.games, "id");
    this.debug(`Fetched ${Object.keys(normalized.entities.games).length} games from API`);

    await db.saveAllEntities({
      entities: {
        ...normalized.entities,
        profiles: {
          [meId]: {
            myGameIds: remoteGameIds,
          },
        },
      },
    });
  }
}
