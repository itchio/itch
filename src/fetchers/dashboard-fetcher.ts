
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

    let pushLocal = async () => {
      let query = gameRepo.createQueryBuilder("games");

      query.where("games.id in (:gameIds)");

      query.setParameters({
        meId,
        gameIds: libraryGameIds,
      });

      const totalCount = libraryGameIds.length;

      if (filter) {
        query.andWhere("(games.title LIKE :query or games.shortText LIKE :query)", {
          query: `%${filter.toLowerCase()}%`,
        });
      }

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

      query.setOffset(offset).setLimit(limit); 

      const [games, gamesCount] = await query.getManyAndCount();

      this.push({
        games: indexBy(games, "id"),
        gameIds: pluck(games, "id"),
        gamesCount,
        gamesOffset: offset,
        hiddenCount: totalCount - gamesCount,
        lastOffset: offset,
        lastLimit: limit,
      });
    };

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
        profiles: {
          [meId]: {
            myGameIds: remoteGameIds,
          },
        },
      },
    });

    localGames = await gameRepo.find({userId: meId});
    this.push({
      games: indexBy(localGames, "id")
    });

    const goners = difference(localGameIds, remoteGameIds);
    if (goners.length > 0) {
      this.debug(`After /my-games, removing ${goners.length} goners: ${JSON.stringify(goners)}`)
      await db.deleteAllEntities({entities: {games: goners}});
    }

    return new Outcome("success");
  }
}
