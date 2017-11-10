import { Fetcher } from "./fetcher";
import getByIds from "../helpers/get-by-ids";
import { indexBy } from "underscore";

import { fromJSONField } from "../db/json-field";
import { Game } from "ts-itchio-api";

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

      const gameIds = fromJSONField(
        localCollection && localCollection.gameIds,
        ea
      );

      const localGames = db.games.all(k => k.where("id in ?", gameIds));
      const orderedLocalGames = getByIds(indexBy(localGames, "id"), gameIds);

      const oldGames = this.space().games();
      let fullGames = [
        ...orderedLocalGames,
        ...getByIds(
          oldGames.set || {},
          (oldGames.ids || []).slice(orderedLocalGames.length)
        ),
      ];

      this.pushAllGames(fullGames, {
        totalCount: localCollection.gamesCount,
      });
    }

    const collResponse = await this.withApi(async api => {
      return await api.collection(collectionId);
    });

    let remoteCollection = collResponse.entities.collections[collectionId];

    this.push({
      collections: {
        set: { [collectionId]: remoteCollection },
        ids: [collectionId],
      },
    });

    const gamesResponse = await this.withApi(async api => {
      return await api.collectionGames(collectionId);
    });

    const remoteGames = gamesResponse.entities.games;
    const remoteGameIds: number[] = gamesResponse.result.gameIds;
    this.pushAllGames(getByIds<Game>(remoteGames, remoteGameIds));
  }

  clean() {
    this.push(
      {
        collections: null,
        users: null,
        games: null,
      },
      { shallow: true }
    );
  }
}
