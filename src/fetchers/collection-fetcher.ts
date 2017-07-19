import { Fetcher } from "./types";
import getByIds from "../helpers/get-by-ids";
import { indexBy } from "underscore";

import { IGame } from "../db/models/game";

import normalize from "../api/normalize";
import { collection, game, arrayOf } from "../api/schemas";

import { fromJSONField } from "../db/json-field";

import { pathToId } from "../util/navigation";

const emptyArr = [];

export default class CollectionFetcher extends Fetcher {
  async work(): Promise<void> {
    const { db } = this.ctx;

    if (this.hasGames() && !this.warrantsRemote(this.reason)) {
      const { games, gameIds } = this.tabData();
      this.pushAllGames(getByIds(games, gameIds));
      return;
    }

    const path = this.tabData().path;
    const collectionId = +pathToId(path);

    let localCollection = db.collections.findOneById(collectionId);

    if (localCollection) {
      this.push({
        collections: {
          [collectionId]: localCollection,
        },
      });

      const gameIds = fromJSONField<number[]>(
        localCollection && localCollection.gameIds,
        emptyArr,
      );

      const localGames = db.games.all(k => k.select().whereIn("id", gameIds));
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
        [collectionId]: remoteCollection,
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

  hasGames(): boolean {
    const gameIds = this.tabData().gameIds || emptyArr;
    return gameIds.length > 0;
  }
}
