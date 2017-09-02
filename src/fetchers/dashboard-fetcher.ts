import { Fetcher } from "./types";
import * as squel from "squel";

import normalize from "../api/normalize";
import { game, arrayOf } from "../api/schemas";

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
        this.tabId,
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

    const apiResponse = await this.withApi(async api => {
      return await api.myGames();
    });

    const normalized = normalize(apiResponse, {
      games: arrayOf(game),
    });
    const meId = this.ensureCredentials().me.id;

    const remoteGameIds = pluck(normalized.entities.games, "id");
    this.debug(
      `Fetched ${Object.keys(normalized.entities.games).length} games from API`
    );

    db.saveMany({
      ...normalized.entities,
      profiles: {
        [meId]: {
          id: meId,
          myGameIds: remoteGameIds,
        },
      },
    });
  }
}
