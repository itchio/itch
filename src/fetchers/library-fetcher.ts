import { Fetcher } from "./fetcher";
import * as squel from "squel";

import { addSortAndFilterToQuery } from "./sort-and-filter";

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
    const ownedKeysRes = await this.withApi(async api => {
      return await api.myOwnedKeys();
    });

    const downloadKeys = ownedKeysRes.entities.downloadKeys || emptyObj;
    for (const id of Object.keys(downloadKeys)) {
      downloadKeys[id].ownerId = meId;
    }

    const { db } = this.ctx;
    db.saveMany(ownedKeysRes.entities);

    await this.pushLocal();
  }

  async pushLocal() {
    const { db, store } = this.ctx;
    const { commons } = store.getState();

    const { libraryGameIds } = commons;

    let doQuery = (k: squel.Select) =>
      addSortAndFilterToQuery(
        k,
        squel.expr().and("games.id in ?", libraryGameIds),
        this.tab,
        store
      );

    const games = db.games.all(k => doQuery(k).field("games.*"));
    this.pushFilteredGames(games, libraryGameIds.length);
  }
}
