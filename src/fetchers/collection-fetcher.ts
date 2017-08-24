import { Fetcher } from "./types";
import getByIds from "../helpers/get-by-ids";
import { indexBy } from "underscore";

import { IGame } from "../db/models/game";

import normalize from "../api/normalize";
import { collection, game, arrayOf } from "../api/schemas";

import { fromJSONField } from "../db/json-field";

const ea = [];

export default class CollectionFetcher extends Fetcher {
  async work(): Promise<void> {
    const { db } = this.ctx;

    // FIXME: we need a way to filter items without re-fetching from remote
    // but the previous way to do it was broken

    const collectionId = this.space().numericId();
    let localCollection = db.collections.findOneById(collectionId);

    if (localCollection) {
      this.push({
        collections: {
          set: { [collectionId]: localCollection },
          ids: [collectionId],
        },
      });

      const gameIds = fromJSONField<number[]>(
        localCollection && localCollection.gameIds,
        ea
      );

      const localGames = db.games.all(k => k.where("id in ?", gameIds));
      const orderedLocalGames = getByIds(indexBy(localGames, "id"), gameIds);

      this.pushAllGames(orderedLocalGames, {
        totalCount: localCollection.gamesCount,
      });
    }

    let normalized;
    const collResponse = await this.withApi(async api => {
      return await api.collection(collectionId);
    });

    normalized = normalize(collResponse, {
      collection: collection,
    });
    let remoteCollection = normalized.entities.collections[collectionId];

    this.push({
      collections: {
        set: { [collectionId]: remoteCollection },
        ids: [collectionId],
      },
    });

    const gamesResponse = await this.withApi(async api => {
      return await api.collectionGames(collectionId);
    });

    normalized = normalize(gamesResponse, {
      games: arrayOf(game),
    });

    const remoteGames = normalized.entities.games;
    const remoteGameIds: number[] = normalized.result.gameIds;
    this.pushAllGames(getByIds<IGame>(remoteGames, remoteGameIds));
  }
}
