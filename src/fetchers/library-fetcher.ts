
import {Fetcher, Outcome, OutcomeState, FetchReason} from "./types";
import db from "../db";
import Game from "../db/models/game";
import DownloadKey from "../db/models/download-key";
import Cave from "../db/models/cave";

import client from "../api";
import normalize from "../api/normalize";
import {downloadKey} from "../api/schemas";
import {isNetworkError} from "../net/errors";

import {arrayOf} from "idealizr";

import {pluck, indexBy, difference} from "underscore";

const defaultObj = {} as any;

export default class LibraryFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    const {session} = this.store.getState();

    let meId: number;
    try {
      meId = session.credentials.me.id;
    } catch (e) {
      this.logger.warn(`Couldn't get meId, not logged in maybe? ${e}`);
      return this.retry();
    }

    const tabParams = session.tabParams[this.tabId] || defaultObj;
    const {sortBy, sortDirection = "DESC"} = tabParams;

    const tabPagination = session.tabPagination[this.tabId] || defaultObj;
    let {offset = 0, limit = 30} = tabPagination;

    const {libraryGameIds} = this.store.getState().commons;

    const overscan = 12;

    limit += overscan;
    offset -= overscan;
    offset = (offset >= 0 ? offset : 0);

    this.logger.info(`offset = ${offset}, limit = ${limit}`);

    const gameRepo = db.getRepo(Game);
    const keyRepo = db.getRepo(DownloadKey);
    let pushLocal = async () => {
      let query = gameRepo.createQueryBuilder("games");

      query.where("games.id in (:gameIds)");

      query.setParameters({
        meId,
        gameIds: libraryGameIds,
      });

      const totalCount = libraryGameIds.length;

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
    await pushLocal();

    if (this.reason === FetchReason.TabParamsChanged || this.reason === FetchReason.TabPaginationChanged) {
      // that'll do. no need to fire an API request when scrolling :)
      return new Outcome(OutcomeState.Success);
    }

    const {credentials} = session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    const {key} = credentials;
    const api = client.withKey(key);
    let normalized;
    try {
      const apiResponse = await api.myOwnedKeys();
      normalized = normalize(apiResponse, {
        owned_keys: arrayOf(downloadKey),
      });
    } catch (e) {
      this.logger.error(`API error:`, e);
      if (isNetworkError(e)) {
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
      await db.deleteAllEntities({
        entities: {
          downloadKeys: goners,
        },
      });
    } else {
      this.logger.info(`no goners`);
    }

    const {downloadKeys} = normalized.entities;
    for (const id of Object.keys(downloadKeys)) {
      downloadKeys[id].ownerId = meId;
    }

    await db.saveAllEntities({
      entities: normalized.entities,
    });
    await pushLocal();

    return new Outcome(OutcomeState.Success);
  }
}
