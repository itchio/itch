import { Fetcher, Outcome } from "./types";
import db from "../db";

import normalize from "../api/normalize";
import { collection, arrayOf } from "../api/schemas";

import { indexBy } from "underscore";

const emptyObj = {};

export default class CollectionsFetcher extends Fetcher {
  constructor() {
    super();
  }

  async work(): Promise<Outcome> {
    await this.pushLocal();

    if (this.warrantsRemote(this.reason)) {
      await this.remote();
      await this.pushLocal();
    }

    return this.success();
  }

  async pushLocal() {
    const query = db.collections.createQueryBuilder("collections");
    query.where("userId = :meId");
    query.addParameters({ meId: this.ensureCredentials().me.id });

    const localCollections = await query.getMany();
    let allGameIds: number[] = [];
    for (const c of localCollections) {
      if (c.gameIds) {
        allGameIds = [...allGameIds, ...c.gameIds];
      }
    }

    let localGames = [];
    if (allGameIds.length > 0) {
      localGames = await db.games
        .createQueryBuilder("g")
        .where("g.id in (:gameIds)")
        .setParameters({ gameIds: allGameIds })
        .getMany();
    }
    this.push({
      collections: indexBy(localCollections, "id"),
      games: indexBy(localGames, "id"),
    });
  }

  async remote() {
    const normalized = await this.withApi(async api => {
      return normalize(await api.myCollections(), {
        collections: arrayOf(collection),
      });
    });

    const collections = normalized.entities.collections || emptyObj;
    const meId = this.ensureCredentials().me.id;
    for (const id of Object.keys(collections)) {
      collections[id].userId = meId;
    }

    await db.saveMany(normalized.entities);
  }
}
