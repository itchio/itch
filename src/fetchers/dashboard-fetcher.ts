import { Fetcher } from "./fetcher";
import * as squel from "squel";

import { addSortAndFilterToQuery } from "./sort-and-filter";
import { fromJSONField } from "../db/json-field";

import { pluck } from "underscore";

const ea = [];

export default class DashboardFetcher extends Fetcher {
  async work(): Promise<void> {
    await this.pushLocal();

    if (this.warrantsRemote(this.reason)) {
      await this.remote();
      await this.pushLocal();
    }
  }

  async pushLocal() {
    const { db, store } = this.ctx;
    const meId = this.ensureCredentials().me.id;
    const profile = db.profiles.findOneById(meId);
    if (!profile) {
      this.debug(`Could not find a profile for ${meId}`);
      return;
    }
    const myGameIds = fromJSONField(profile.myGameIds, ea);

    let doQuery = (k: squel.Select) =>
      addSortAndFilterToQuery(
        k,
        squel.expr().and("games.id in ?", myGameIds),
        this.tab,
        store
      );

    this.pushGames({
      totalCount: myGameIds.length,
      range: db.games.all(k => doQuery(k).field("games.*")),
      getFilteredCount: () => db.games.count(k => doQuery(k)),
    });
  }

  async remote() {
    const { db } = this.ctx;

    const myGamesRes = await this.withApi(async api => await api.myGames());
    const meId = this.ensureCredentials().me.id;

    const remoteGameIds = pluck(myGamesRes.entities.games, "id");
    this.debug(
      `Fetched ${Object.keys(myGamesRes.entities.games).length} games from API`
    );

    db.saveMany({
      ...myGamesRes.entities,
      profiles: {
        [meId]: {
          id: meId,
          myGameIds: remoteGameIds,
        },
      },
    });
  }
}
