
import {Fetcher, Outcome, OutcomeState} from "./types";
import db from "../db";
import Game from "../db/models/game";
import Collection from "../db/models/collection";

import normalize from "../api/normalize";
import {collection, game, arrayOf} from "../api/schemas";

import {sortAndFilter} from "./sort-and-filter";

import {indexBy, map, pluck} from "underscore";

import {pathToId} from "../util/navigation";

export default class CollectionFetcher extends Fetcher {

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
      gamesCount: localCollection.gamesCount,
      collections: {
        [collectionId]: localCollection,
      },
    });

    const {credentials} = this.store.getState().session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    let normalized;
    const collResponse = await this.withApi(async (api) => {
      return await api.collection(collectionId);
    });

    normalized = normalize(collResponse, {
      collection: collection,
    });
    let remoteCollection = normalized.entities.collections[collectionId];

    const gamesResponse = await this.withApi(async (api) => {
      return await api.collectionGames(collectionId);
    });

    normalized = normalize(gamesResponse, {
      games: arrayOf(game),
    });

    const remoteGames = normalized.entities.games;
    const remoteGameIds = normalized.result.gameIds;

    const games = map(remoteGameIds, (id) => remoteGames[id]);
    const sortedGames = sortAndFilter(games, this.tabId, this.store);

    this.push({
      games: remoteGames,
      gameIds: pluck(sortedGames, "id"),
      gamesOffset: 0,
      gamesCount: remoteCollection.gamesCount,
      collections: {
        [collectionId]: remoteCollection,
      },
    });

    return new Outcome(OutcomeState.Success);
  }
}


