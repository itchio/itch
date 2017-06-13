
import {Fetcher, Outcome} from "./types";
import db from "../db";
import getByIds from "../db/get-by-ids";

import {IGameRecordSet} from "../types";

import normalize from "../api/normalize";
import {collection, game, arrayOf} from "../api/schemas";

import {sortAndFilter} from "./sort-and-filter";

import {indexBy, pluck} from "underscore";

import {pathToId} from "../util/navigation";

const emptyArr = [];

export default class CollectionFetcher extends Fetcher {

  async work(): Promise<Outcome> {
    if (this.hasGames() && !this.warrantsRemote(this.reason)) {
      const {games, gameIds, gamesCount} = this.tabData();
      await this.pushGames(games, gameIds, gamesCount);
      return this.success();
    }

    const path = this.tabData().path;
    const collectionId = +pathToId(path);

    let localCollection = await db.collections.findOneById(collectionId);

    if (localCollection) {
      this.push({
        collections: {
          [collectionId]: localCollection,
        },
      });

      let gameIds: number[] = [];
      if (localCollection && localCollection.gameIds) {
        gameIds = localCollection.gameIds;
      }

      const localGames = await db.games.findByIds(localCollection.gameIds);
      await this.pushGames(indexBy(localGames, "id"), gameIds, localCollection.gamesCount);
    }

    let normalized;
    const collResponse = await this.withApi(async (api) => {
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

    const gamesResponse = await this.withApi(async (api) => {
      return await api.collectionGames(collectionId);
    });

    normalized = normalize(gamesResponse, {
      games: arrayOf(game),
    });

    const remoteGames = normalized.entities.games;
    const remoteGameIds: number[] = normalized.result.gameIds;

    this.pushGames(remoteGames, remoteGameIds, remoteCollection.gamesCount);

    return this.success();
  }

  hasGames(): boolean {
    const gameIds = this.tabData().gameIds || emptyArr;
    return gameIds.length > 0;
  }

  async pushGames(games: IGameRecordSet, gameIds: number[], gamesCount: number) {
    const sortedGames = sortAndFilter(getByIds(games, gameIds), this.tabId, this.store);

    this.push({
      games: games,
      gameIds: pluck(sortedGames, "id"),
      gamesOffset: 0,
      gamesCount: gamesCount,
    });
  }
}
