
import {Fetcher, Outcome} from "./types";
import Game from "../db/models/game";
import DownloadKey from "../db/models/download-key";
import compareRecords from "../util/compare-records";
import client from "../util/api";

import normalize from "../util/normalize";
import {elapsed} from "../util/format";
import {arrayOf} from "idealizr";
import {downloadKey} from "../util/schemas";

import {pluck, indexBy, difference} from "underscore";

import {getColumns} from "../util/market";

export default class LibraryFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    const {market} = this.getMarkets();
    if (!market) {
      this.logger.warn(`No user market :(`);
      return this.retry();
    }

    const {session} = this.store.getState();

    let meId: number;
    try {
      meId = session.credentials.me.id;
    } catch (e) {
      this.logger.warn(`Couldn't get meId, not logged in maybe? ${e}`);
      return this.retry();
    }

    const tabParams = session.tabParams[this.tabId];

    const gameRepo = market.getRepo(Game);
    const keyRepo = market.getRepo(DownloadKey);
    let pushLocal = async () => {
      const t1 = Date.now();
      let {offset = 0, limit = 30} = (tabParams || {});
      let query = gameRepo.createQueryBuilder("games")
        .where("exists (select 1 from downloadKeys where downloadKeys.gameId = games.id)")
        .orderBy("games.createdAt", "DESC")
        .setOffset(offset).setLimit(limit); 
      const t2 = Date.now();

      let [games, gamesCount] = await query.getManyAndCount();
      const t3 = Date.now();

      const oldTabData = this.store.getState().session.tabData[this.tabId];
      let equalGames = 0;
      let presentGames = 0;

      if (oldTabData && oldTabData.games && Object.keys(oldTabData.games).length > 0) {
        // tslint:disable-next-line
        for (let i = 0; i < games.length; i++) {
          const game = games[i];
          const oldGame = oldTabData.games[game.id];
          if (oldGame) {
            if (compareRecords(oldGame, game, getColumns(Game))) {
              games[i] = oldGame;
              equalGames++;
            } else {
              presentGames++;
            }
          }
        }
      }
      this.logger.info("games equal", equalGames,
       "present", presentGames, "fresh", games.length - equalGames - presentGames);

      this.push({
        games: indexBy(games, "id"),
        gameIds: pluck(games, "id"),
        gamesCount,
        gamesOffset: offset,
      });
      const t4 = Date.now();
      this.logger.info("query", elapsed(t1, t2),
        "select", elapsed(t2, t3),
        "push", elapsed(t3, t4));
    };
    await pushLocal();

    if (this.reason === "tab-params-changed") {
      // that'll do. no need to fire an API request when scrolling :)
      return new Outcome("success");
    }

    const {credentials} = session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    const {key} = credentials;
    const api = client.withKey(key);
    let normalized;
    try {
      const t1 = Date.now();
      const apiResponse = await api.myOwnedKeys();
      const t2 = Date.now();
      normalized = normalize(apiResponse, {
        owned_keys: arrayOf(downloadKey),
      });
      const t3 = Date.now();
      this.logger.info("api", elapsed(t1, t2), "norm", elapsed(t2, t3));
    } catch (e) {
      this.logger.error(`API error:`, e);
      if (client.isNetworkError(e)) {
        return this.retry();
      } else {
        throw e;
      }
    }

    const rawKeys = await keyRepo.createQueryBuilder("k").select("id").getRawMany();
    let oldKeyIds = pluck(rawKeys, "id");
    let newKeyIds = pluck(normalized.entities.downloadKeys, "id");
    let goners = difference(oldKeyIds, newKeyIds);
    if (goners.length > 0) {
      this.logger.info(`goners = `, goners);
      await market.deleteAllEntities({
        entities: {
          downloadKeys: goners,
        },
      });
    } else {
      this.logger.info(`no goners`);
    }

    await market.saveAllEntities({
      entities: normalized.entities,
    });
    await pushLocal();

    return new Outcome("success");
  }
}
