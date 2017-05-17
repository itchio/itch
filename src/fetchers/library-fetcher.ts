
import {Fetcher, Outcome} from "./types";
import Game from "../models/game";
import DownloadKey from "../models/download-key";
import client from "../util/api";

import normalize from "../util/normalize";
import {elapsed} from "../util/format";
import {arrayOf} from "idealizr";
import {downloadKey} from "../util/schemas";

import {pluck, indexBy, difference} from "underscore";

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
      const t1 = Date.now();
      let games = await gameRepo.createQueryBuilder("games")
        .where("exists (select 1 from downloadKeys where downloadKeys.gameId = games.id)")
        .getMany();
      const t2 = Date.now();
      this.push({
        games: indexBy(games, "id"),
      });
      const t3 = Date.now();
      this.debug(`db ${elapsed(t1, t2)}, push ${elapsed(t2, t3)}`);
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
      const t1 = Date.now();
      const apiResponse = await api.myOwnedKeys();
      const t2 = Date.now();
      normalized = normalize(apiResponse, {
        owned_keys: arrayOf(downloadKey),
      });
      const t3 = Date.now();
      this.debug(`api ${(t2 - t1).toFixed()}ms, norm ${(t3 - t2).toFixed(2)}ms`);
    } catch (e) {
      this.debug(`API error:`, e);
      if (client.isNetworkError(e)) {
        return new Outcome("retry");
      } else {
        throw e;
      }
    }

    const rawKeys = await keyRepo.createQueryBuilder("k").select("id").getRawMany();
    let oldKeyIds = pluck(rawKeys, "id");
    let newKeyIds = pluck(normalized.entities.downloadKeys, "id");
    let goners = difference(oldKeyIds, newKeyIds);
    if (goners.length > 0) {
      this.debug(`goners = `, goners);
      await market.deleteAllEntities({
        entities: {
          downloadKeys: goners,
        },
      });
    } else {
      this.debug(`no goners`);
    }

    await market.saveAllEntities({
      entities: normalized.entities,
    });
    await pushLocal();

    return new Outcome("success");
  }
}
