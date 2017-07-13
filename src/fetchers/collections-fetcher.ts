import { Fetcher } from "./types";

import normalize from "../api/normalize";
import { collection, arrayOf } from "../api/schemas";

import { fromJSONField } from "../db/json-field";

import { indexBy } from "underscore";

const emptyObj = {};

export default class CollectionsFetcher extends Fetcher {
  constructor() {
    super();
  }

  async work(): Promise<void> {
    await this.pushLocal();

    if (this.warrantsRemote(this.reason)) {
      await this.remote();
      await this.pushLocal();
    }
  }

  async pushLocal() {
    const { db } = this.ctx;
    const meId = this.ensureCredentials().me.id;
    const localCollections = db.collections.find({ userId: meId });

    let allGameIds: number[] = [];
    for (const c of localCollections) {
      const collectionGameIds = fromJSONField<number[]>(c.gameIds);
      if (c.gameIds) {
        allGameIds = [...allGameIds, ...collectionGameIds];
      }
    }

    let localGames = [];
    if (allGameIds.length > 0) {
      localGames = db.games.all(k => k.select().whereIn("id", allGameIds));
    }
    this.push({
      collections: indexBy(localCollections, "id"),
      games: indexBy(localGames, "id"),
    });
  }

  async remote() {
    const { db } = this.ctx;
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

    db.saveMany(normalized.entities);
  }
}
