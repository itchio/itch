import { Fetcher, FetchReason } from "./fetcher";
import getByIds from "../helpers/get-by-ids";
import { indexBy, isEmpty, pick } from "underscore";

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

      const gameIds = (localCollection && localCollection.gameIds) || ea;

      const localGames = db.games.allByKeySafe(gameIds);
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
    if (localCollection) {
      remoteCollection.userId = localCollection.userId;
    }

    this.push({
      collections: {
        set: { [collectionId]: remoteCollection },
        ids: [collectionId],
      },
    });

    if (localCollection) {
      try {
        db.saveMany(collResponse.entities);
      } catch (e) {
        this.debug(`Could not persist remote collection: ${e.stack}`);
      }

      this.debug(`Local collection updatedAt: ${localCollection.updatedAt}`);
      this.debug(`Remote collection updatedAt: ${remoteCollection.updatedAt}`);
      if (remoteCollection.updatedAt <= localCollection.updatedAt) {
        if (this.reason == FetchReason.TabReloaded) {
          this.debug(
            `Remote isn't more recent, but this is a manual reload: fetching remote anyway.`
          );
        } else {
          this.debug(`Remote isn't more recent, not fetching games`);
          return;
        }
      }
    }

    let fetchedGames = 0;
    let page = 1;
    let allGamesList: Game[] = [];

    while (fetchedGames < remoteCollection.gamesCount) {
      this.debug(
        `Fetching page ${page}... (${fetchedGames}/${remoteCollection.gamesCount} games fetched)`
      );
      const gamesResponse = await this.withApi(async api => {
        return await api.collectionGames(collectionId, page);
      });
      const { gameIds } = gamesResponse.result;
      if (isEmpty(gameIds)) {
        break;
      }

      const remoteGames = gamesResponse.entities.games;
      const gameList = getByIds<Game>(remoteGames, gameIds);
      allGamesList = [...allGamesList, ...gameList];

      if (localCollection) {
        try {
          db.saveMany(gamesResponse.entities);
          remoteCollection.gameIds = pick(allGamesList, "id");
          db.saveOne("collections", remoteCollection.id, remoteCollection);
        } catch (e) {
          this.debug(`Couldn't persist games locally: ${e.stack}`);
        }
      }

      page++;
      fetchedGames += gameIds.length;
    }
    this.debug(
      `Fetched ${allGamesList.length}/${remoteCollection.gamesCount} games total`
    );

    allGamesList.length = remoteCollection.gamesCount;
    this.pushAllGames(allGamesList, {
      totalCount: remoteCollection.gamesCount,
    });
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
