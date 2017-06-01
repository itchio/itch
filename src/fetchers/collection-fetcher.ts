
import {Fetcher, Outcome, OutcomeState} from "./types";
import db from "../db";
import Game from "../db/models/game";
import Collection from "../db/models/collection";
import client from "../api";

import normalize from "../api/normalize";
import {collection, game, arrayOf} from "../api/schemas";
import {isNetworkError} from "../net/errors";

import {indexBy} from "underscore";

import {pathToId} from "../util/navigation";

export default class CollectionFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    const path = this.store.getState().session.tabData[this.tabId].path;
    const collectionId = +pathToId(path);

    const gameRepo = db.getRepo(Game);
    const collectionRepo = db.getRepo(Collection);
    let localCollection = await collectionRepo.findOneById(collectionId);
    let localGames = {};
    let gameIds = [];
    if (localCollection && localCollection.gameIds) {
      gameIds = localCollection.gameIds;
    }

    localGames = await gameRepo.findByIds(localCollection.gameIds);
    this.push({
      games: indexBy<Game>(localGames, "id"),
      gameIds: gameIds,
      gamesOffset: 0,
      gamesCount: gameIds.length,
      collections: {
        [collectionId]: localCollection,
      },
    });

    const {credentials} = this.store.getState().session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    const {key} = credentials;
    const api = client.withKey(key);
    let normalized;
    try {
      this.debug(`Fetching collection via API...`);
      normalized = normalize(await api.collection(collectionId), {
        collection: collection,
      });
    } catch (e) {
      this.debug(`API error:`, e);
      if (isNetworkError(e)) {
        return new Outcome(OutcomeState.Retry);
      } else {
        throw e;
      }
    }
    let remoteCollection = normalized.entities.collections[collectionId];

    try {
      this.debug(`Fetching collection games via API...`);
      normalized = normalize(await api.collectionGames(collectionId), {
        games: arrayOf(game),
      });
    } catch (e) {
      this.debug(`API error:`, e);
      if (isNetworkError(e)) {
        return new Outcome(OutcomeState.Retry);
      } else {
        throw e;
      }
    }
    let remoteCollectionGames = normalized.entities.games;
    remoteCollection.gameIds = normalized.result.gameIds;

    this.push({
      games: remoteCollectionGames,
      gameIds: remoteCollection.gameIds,
      gamesOffset: 0,
      gamesCount: remoteCollection.gameIds.length,
      collections: {
        [collectionId]: remoteCollection,
      },
    });

    return new Outcome(OutcomeState.Success);
  }
}


