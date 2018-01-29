import { Fetcher } from "./fetcher";

import { fromJSONField } from "../db/json-field";

import { indexBy } from "underscore";
import { GAMES_SHOWN_PER_COLLECTION } from "./constants";

const emptyObj = {};
const ea: any[] = [];

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

    const profile = db.profiles.findOneById(meId);
    if (!profile) {
      return;
    }

    const localCollectionIds = fromJSONField(profile.myCollectionIds, ea);
    const localCollections = db.collections.allByKeySafe(localCollectionIds);

    let allGameIds: number[] = [];
    for (const c of localCollections) {
      const collectionGameIds = c.gameIds || ea;
      allGameIds = [
        ...allGameIds,
        ...collectionGameIds.slice(0, GAMES_SHOWN_PER_COLLECTION),
      ];
    }

    let localGames = [];
    if (allGameIds.length > 0) {
      localGames = db.games.all(k => k.where("id in ?", allGameIds));
    }
    this.push({
      collections: {
        set: indexBy(localCollections, "id"),
        ids: localCollectionIds,
      },
      games: {
        set: indexBy(localGames, "id"),
        ids: [],
      },
    });
  }

  async remote() {
    const { db } = this.ctx;
    const collRes = await this.withApi(async api => await api.myCollections());

    const collections = collRes.entities.collections || emptyObj;
    const meId = this.ensureCredentials().me.id;
    for (const id of Object.keys(collections)) {
      const remoteCollection = collections[id];
      const localCollection = db.collections.findOneById(id);
      if (localCollection && Array.isArray(localCollection.gameIds)) {
        // don't bring back total number of gameIds to 15
        remoteCollection.gameIds = localCollection.gameIds;
      }
      remoteCollection.userId = meId;
    }

    db.saveMany(collRes.entities);

    const { collectionIds } = collRes.result;
    db.saveOne("profiles", meId, { myCollectionIds: collectionIds });
  }
}
