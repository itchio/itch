
import {Fetcher, Outcome} from "./types";

import db from "../db";
import Game from "../db/models/game";
import Cave from "../db/models/cave";
import Profile from "../db/models/profile";

import client from "../api";
import normalize from "../api/normalize";
import {game, arrayOf} from "../api/schemas";
import {isNetworkError} from "../net/errors";

import {pluck, indexBy} from "underscore";

const emptyArr = [];

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

    const profileRepo = db.getRepo(Profile);
    const gameRepo = db.getRepo(Game);

    const tabParams = this.store.getState().session.tabParams[this.tabId] || {};

    const pushLocal = async () => {
      const profile = await profileRepo.findOneById(meId);
      if (!profile) {
        return;
      }
      const myGameIds = profile.myGameIds || emptyArr;

      let query = gameRepo.createQueryBuilder("games");

      query.where("games.id in (:gameIds)");

      query.setParameters({
        meId,
        gameIds: myGameIds,
      });

      const totalCount = myGameIds.length;

      const {sortBy, sortDirection = "DESC"} = tabParams;

      let joinCave = false;

      if (sortBy === "title") {
        query.orderBy("games.title", ("COLLATE NOCASE " + sortDirection) as any);
      } else if (sortBy === "publishedAt") {
        query.orderBy("games.publishedAt", sortDirection);
      } else if (sortBy === "secondsRun") {
        query.orderBy("caves.secondsRun", sortDirection);
        joinCave = true;
      } else if (sortBy === "lastTouched") {
        query.orderBy("caves.lastTouched", sortDirection);
        joinCave = true;
      } else {
        query.orderBy("games.createdAt", sortDirection);
      }

      if (joinCave) {
        query.leftJoin(
          Cave,
          "caves",
          "caves.id = (" +
              "select caves.id from caves " +
              "where caves.gameId = games.id " +
              "limit 1" +
            ")",
        );
      }

      // TODO: offset, limit

      const [games, gamesCount] = await query.getManyAndCount();

      this.push({
        games: indexBy(games, "id"),
        gameIds: pluck(games, "id"),
        gamesCount,
        gamesOffset: 0,
        hiddenCount: totalCount - gamesCount,
      });
    };
    await pushLocal();

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
        return this.retry();
      } else {
        throw e;
      }
    }
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
    await pushLocal();    

    return this.success();
  }
}
