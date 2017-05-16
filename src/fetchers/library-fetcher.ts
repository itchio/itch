
import {Fetcher, Outcome} from "./types";
import Game from "../models/game";
import DownloadKey from "../models/download-key";
import client from "../util/api";

import normalize from "../util/normalize";
import {arrayOf} from "idealizr";
import {downloadKey} from "../util/schemas";

import {pluck, indexBy} from "underscore";

export default class LibraryFetcher extends Fetcher {
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

    const gameRepo = market.getRepo(Game);
    const keyRepo = market.getRepo(DownloadKey);
    let pushLocal = async () => {
      this.debug(`retrieving library from db`);
      let keys = await keyRepo.find();
      let games = await gameRepo.createQueryBuilder("g").where("g.id in (:gameIds)", {
        gameIds: pluck(keys, "gameId"),
      }).getMany();
      this.debug(`got em!`);
      this.push({
        games: indexBy(games, "id"),
        downloadKeys: indexBy(keys, "id"),
      });
    };
    await pushLocal();

    const {credentials} = this.store.getState().session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    const {key} = credentials;
    const api = client.withKey(key);
    let normalized;
    try {
      this.debug(`Firing API requests...`);
      const apiResponse = await api.myOwnedKeys();
      this.debug(`API response:, `, apiResponse);
      normalized = normalize(apiResponse, {
        owned_keys: arrayOf(downloadKey),
      });
    } catch (e) {
      this.debug(`API error:`, e);
      if (client.isNetworkError(e)) {
        return new Outcome("retry");
      } else {
        throw e;
      }
    }
    this.debug(`fetched entities: `, normalized.entities);
    await market.saveAllEntities({
      entities: normalized.entities,
    });
    this.debug(`saved in db!`);
    await pushLocal();

    return new Outcome("success");
  }
}

