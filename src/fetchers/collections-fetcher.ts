
import {Fetcher, Outcome} from "./types";
import db from "../db";
import Collection from "../db/models/collection";
import Game from "../db/models/game";

import normalize from "../api/normalize";
import {collection, arrayOf} from "../api/schemas";

import {indexBy} from "underscore";

export default class CollectionsFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    await this.pushLocal();

    if (this.warrantsRemote(this.reason)) {
      await this.remote();
      await this.pushLocal();
    }

    return this.success();
  }

  async pushLocal () {
    const collectionsRepo = db.getRepo(Collection);
    const gamesRepo = db.getRepo(Game);
    const query = collectionsRepo.createQueryBuilder("collections");
    query.where("userId = :meId");
    query.addParameters({meId: this.ensureCredentials().me.id});

    const localCollections = await query.getMany();
    let allGameIds: number[] = [];
    for (const c of localCollections) {
      if (c.gameIds) {
        allGameIds = [...allGameIds, ...c.gameIds];
      }
    }

    let localGames = [];
    if (allGameIds.length > 0) {
      localGames = await gamesRepo.createQueryBuilder("g")
        .where("g.id in (:gameIds)")
        .setParameters({gameIds: allGameIds}).getMany();
    }
    this.push({
      collections: indexBy(localCollections, "id"),
      games: indexBy(localGames, "id"),
    });
  }

  async remote () {
    const normalized = await this.withApi(async (api) => {
      return normalize(await api.myCollections(), {
        collections: arrayOf(collection),
      });
    });

    const {collections} = normalized.entities;
    const meId = this.ensureCredentials().me.id;
    for (const id of Object.keys(collections)) {
      collections[id].userId = meId;
    }

    await db.saveAllEntities({
      entities: normalized.entities,
    });
  }
}

