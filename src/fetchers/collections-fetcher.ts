
import {Fetcher, Outcome} from "./types";
import Collection from "../db/models/collection";
import Game from "../db/models/game";
import client from "../util/api";

import normalize from "../util/normalize";
import {arrayOf} from "idealizr";
import {collection} from "../util/schemas";

import {indexBy} from "underscore";

export default class CollectionsFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    const {market} = this.getMarkets();
    if (!market) {
      this.debug(`No user market :(`);
      return this.retry();
    }

    let meId: number;
    try {
      meId = this.store.getState().session.credentials.me.id;
    } catch (e) {
      this.debug(`Couldn't get meId, not logged in maybe? ${e}`);
      return this.retry();
    }

    const collectionsRepo = market.getRepo(Collection);
    const gamesRepo = market.getRepo(Game);
    let pushFromLocal = async () => {
      const localCollections = await collectionsRepo.find();
      let allGameIds: number[] = [];
      for (const c of localCollections) {
        if (c.gameIds) {
          allGameIds = [...allGameIds, ...c.gameIds];
        }
      }
      let localGames = [];
      if (allGameIds.length > 0) {
        localGames = await gamesRepo.findByIds(allGameIds);
      }
      this.push({
        collections: indexBy(localCollections, "id"),
        games: indexBy(localGames, "id"),
      });
    };
    await pushFromLocal();

    const {credentials} = this.store.getState().session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    const {key} = credentials;
    const api = client.withKey(key);
    let normalized;
    try {
      this.debug(`Firing API requests...`);
      normalized = normalize(await api.myCollections(), {
        collections: arrayOf(collection),
      });
    } catch (e) {
      this.debug(`API error:`, e);
      if (client.isNetworkError(e)) {
        return new Outcome("retry");
      } else {
        throw e;
      }
    }

    await market.saveAllEntities({
      entities: normalized.entities,
    });
    await pushFromLocal();

    return new Outcome("success");
  }
}

