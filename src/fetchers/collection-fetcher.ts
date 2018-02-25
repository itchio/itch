import { Fetcher, FetchReason } from "./fetcher";
import getByIds from "../helpers/get-by-ids";
import { indexBy, isEmpty, pluck } from "underscore";

import { Game } from "node-buse/lib/messages";
import { fromDateTimeField } from "../db/datetime-field";

const ea = [] as any[];

export default class CollectionFetcher extends Fetcher {
  async work(): Promise<void> {
    const { db } = this.ctx;
    let forced = this.reason === FetchReason.TabReloaded;
    let dataGamesCount = 0;
    let cachedGames: Game[] = ea;

    {
      // first, filter what we already got
      cachedGames = getByIds(
        this.space().games().set,
        this.space().games().allIds
      );
      dataGamesCount = cachedGames.length;
    }

    if (dataGamesCount == 0) {
      forced = true;
    }

    const collectionId = this.space().firstPathNumber();
    let localCollection = db.collections.findOneById(collectionId);

    let pushedLocals = false;
    if (localCollection) {
      this.pushCollection(localCollection);
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

      this.pushUnfilteredGames(fullGames);
      pushedLocals = true;
    }

    let lastFetched: Date = null;
    if (localCollection) {
      lastFetched = fromDateTimeField(localCollection.fetchedAt);
    } else {
      const dataColl = this.space().collection();
      if (dataColl) {
        lastFetched = fromDateTimeField(dataColl.fetchedAt);
      }
    }

    if (lastFetched && !forced) {
      // never check on collections more than every 5 minutes
      const peaceThreshold = 1000 * 60 * 5;
      const diff = Date.now() - lastFetched.getTime();
      if (diff < peaceThreshold) {
        if (!pushedLocals) {
          this.pushUnfilteredGames(cachedGames);
        }
        return;
      }
    }

    await this.withLoading(async () => {
      const collResponse = await this.withApi(async api => {
        return await api.collection(collectionId);
      });

      let remoteCollection = collResponse.entities.collections[collectionId];
      if (localCollection) {
        // work around lack of `user_id` in API, remove after
        // https://github.com/itchio/itch/issues/1646 is resolved
        remoteCollection.userId = localCollection.userId;
      }

      this.pushCollection(remoteCollection);

      if (localCollection) {
        try {
          db.saveMany(collResponse.entities);
        } catch (e) {
          this.debug(`Could not persist remote collection: ${e.stack}`);
        }
      }

      if (lastFetched && !forced) {
        this.debug(`last updated: ${remoteCollection.updatedAt}`);
        this.debug(`last fetched: ${lastFetched}`);
        const uptodate = remoteCollection.updatedAt <= lastFetched;
        if (uptodate) {
          this.debug(`Remote isn't more recent, not fetching games`);
          return;
        }
      }

      const fetchedAt = new Date();
      let fetchedGames = 0;
      let page = 1;
      let allGamesList: Game[] = [];

      while (fetchedGames < remoteCollection.gamesCount) {
        this.debug(
          `Fetching page ${page}... (${fetchedGames}/${
            remoteCollection.gamesCount
          } games fetched)`
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
            remoteCollection.gameIds = pluck(allGamesList, "id");
            db.saveOne("collections", remoteCollection.id, remoteCollection);
          } catch (e) {
            this.debug(`Couldn't persist games locally: ${e.stack}`);
          }
        }

        page++;
        fetchedGames += gameIds.length;
      }
      this.debug(
        `Fetched ${allGamesList.length}/${
          remoteCollection.gamesCount
        } games total`
      );

      this.pushUnfilteredGames(allGamesList);

      remoteCollection.fetchedAt = fetchedAt;
      this.pushCollection(remoteCollection);

      if (localCollection) {
        try {
          remoteCollection.fetchedAt = fetchedAt;
          db.saveOne("collections", remoteCollection.id, remoteCollection);
        } catch (e) {
          this.debug(`Couldn't persist collection locally: ${e.stack}`);
        }
      }
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
