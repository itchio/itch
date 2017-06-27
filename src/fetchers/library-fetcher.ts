import { Fetcher } from "./types";

import { addSortAndFilterToQuery } from "./sort-and-filter";

import normalize from "../api/normalize";
import { downloadKey } from "../api/schemas";

import { arrayOf } from "idealizr";

import { pluck, indexBy } from "underscore";

const emptyObj = {} as any;

export default class LibraryFetcher extends Fetcher {
  async work(): Promise<void> {
    await this.pushLocal();

    if (this.warrantsRemote(this.reason)) {
      await this.remote();
      await this.pushLocal();
    }
  }

  async remote() {
    const meId = this.ensureCredentials().me.id;
    const apiResponse = await this.withApi(async api => {
      return await api.myOwnedKeys();
    });

    const normalized = normalize(apiResponse, {
      owned_keys: arrayOf(downloadKey),
    });
    const downloadKeys = normalized.entities.downloadKeys || emptyObj;
    for (const id of Object.keys(downloadKeys)) {
      downloadKeys[id].ownerId = meId;
    }

    const { db } = this.ctx;
    await db.saveMany(normalized.entities);

    await this.pushLocal();
  }

  async pushLocal() {
    const { db, store } = this.ctx;
    const { session, commons } = store.getState();

    const tabPagination = session.tabPagination[this.tabId] || emptyObj;
    let { offset = 0, limit = 30 } = tabPagination;

    const { libraryGameIds } = commons;

    let query = db.games.createQueryBuilder("games");

    query.where("games.id in (:gameIds)");
    query.addParameters({
      gameIds: libraryGameIds,
    });

    const totalCount = libraryGameIds.length;

    addSortAndFilterToQuery(query, this.tabId, store);

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
