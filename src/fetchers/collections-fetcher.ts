
import {Fetcher, Outcome} from "./types";
import db from "../db";
import Collection from "../db/models/collection";
import Game from "../db/models/game";

import client from "../api";
import normalize from "../api/normalize";
import {collection, arrayOf} from "../api/schemas";
import {isNetworkError} from "../net/errors";

import {indexBy} from "underscore";

export default class CollectionsFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    let meId: number;
    try {
      meId = this.store.getState().session.credentials.me.id;
    } catch (e) {
      this.debug(`Couldn't get meId, not logged in maybe? ${e}`);
      return this.retry();
    }

    const collectionsRepo = db.getRepo(Collection);
    const gamesRepo = db.getRepo(Game);
    let pushFromLocal = async () => {
      const localCollections = await collectionsRepo.createQueryBuilder("c").select("c.*").getRawMany();
      let allGameIds: number[] = [];
      for (const c of localCollections) {
        let gameIds: number[] = null;
        try {
          gameIds = JSON.parse(c.gameIds);
        } catch (e) {
          continue;
        }

        if (gameIds) {
          allGameIds = [...allGameIds, ...gameIds];
        }
      }
      let localGames = [];
      if (allGameIds.length > 0) {
        localGames = await gamesRepo.createQueryBuilder("g")
          .select("g.*").where("g.id in (:gameIds)")
          .setParameters({gameIds: allGameIds}).getRawMany();
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
      if (isNetworkError(e)) {
        return new Outcome("retry");
      } else {
        throw e;
      }
    }

    const {collections} = normalized.entities;
    for (const id of Object.keys(collections)) {
      collections[id].userId = meId;
    }

    await db.saveAllEntities({
      entities: normalized.entities,
    });
    await pushFromLocal();

    return new Outcome("success");
  }
}

