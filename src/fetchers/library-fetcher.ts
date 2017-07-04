import { Fetcher, FetchReason } from "./types";
import { QueryInterface } from "../db/querier";

import { addSortAndFilterToQuery } from "./sort-and-filter";

import normalize from "../api/normalize";
import { downloadKey } from "../api/schemas";

import { arrayOf } from "idealizr";

import { indexBy } from "underscore";

const emptyObj = {} as any;
const emptyArr = [] as any;

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
    db.saveMany(normalized.entities);

    await this.pushLocal();
  }

  async pushLocal() {
    const { db, store } = this.ctx;
    const { session, commons } = store.getState();

    const tabPagination = session.tabPagination[this.tabId] || emptyObj;
    let { offset = 0, limit = 30 } = tabPagination;
    this.logger.warn(`fetching offset ${offset}, limit ${limit}`);

    const { libraryGameIds } = commons;

    let doQuery = (k: QueryInterface) =>
      addSortAndFilterToQuery(
        k.whereIn("games.id", libraryGameIds),
        this.tabId,
        store,
      );

    const totalCount = libraryGameIds.length;
    const range = db.games.all(k =>
      doQuery(k).offset(offset).limit(limit).select("games.*"),
    );

    const oldData = session.tabData[this.tabId] || emptyObj;
    const gameIds = [...(oldData.gameIds || emptyArr)];

    if (this.reason === FetchReason.TabPaginationChanged && oldData.gameIds) {
      gameIds.length = oldData.gameIds.length;
    } else {
      gameIds.length = db.games.count(k => doQuery(k));
    }

    for (let i = 0; i < range.length; i++) {
      gameIds[i + offset] = range[i].id;
    }

    const games = {
      ...oldData.games || emptyObj,
      ...indexBy(range, "id"),
    };

    this.push({
      games,
      gameIds,
      hiddenCount: totalCount - gameIds.length,
      offset,
      limit,
    });
  }
}
