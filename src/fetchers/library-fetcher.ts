
import {Fetcher, Outcome} from "./types";
import db from "../db";
import Game from "../db/models/game";

import {addSortAndFilterToQuery} from "./sort-and-filter";

import normalize from "../api/normalize";
import {downloadKey} from "../api/schemas";

import {arrayOf} from "idealizr";

import {pluck, indexBy} from "underscore";

const defaultObj = {} as any;

export default class LibraryFetcher extends Fetcher {

  async work(): Promise<Outcome> {
    await this.pushLocal();

    if (this.warrantsRemote(this.reason)) {
      await this.remote();
      await this.pushLocal();
    }

    return this.success();
  }

  async remote() {
    const meId = this.ensureCredentials().me.id;
    const apiResponse = await this.withApi(async (api) => {
      return await api.myOwnedKeys();
    });

    const normalized = normalize(apiResponse, {
      owned_keys: arrayOf(downloadKey),
    });
    const {downloadKeys} = normalized.entities;
    for (const id of Object.keys(downloadKeys)) {
      downloadKeys[id].ownerId = meId;
    }
    await db.saveAllEntities({ entities: normalized.entities });

    await this.pushLocal();
  }

  async pushLocal() {
    const {session, commons} = this.store.getState();

    const tabPagination = session.tabPagination[this.tabId] || defaultObj;
    let {offset = 0, limit = 30} = tabPagination;

    const gameRepo = db.getRepo(Game);
    const {libraryGameIds} = commons;

    let query = gameRepo.createQueryBuilder("games");

    query.where("games.id in (:gameIds)");
    query.addParameters({
      gameIds: libraryGameIds,
    });

    const totalCount = libraryGameIds.length;

    addSortAndFilterToQuery(query, this.tabId, this.store);

    query.setOffset(offset).setLimit(limit); 

    const [games, gamesCount] = await query.getManyAndCount();

    this.push({
      games: indexBy(games, "id"),
      gameIds: pluck(games, "id"),
      gamesCount,
      gamesOffset: offset,
      hiddenCount: totalCount - gamesCount,
    });
  }

}
