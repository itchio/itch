
import {Fetcher, Outcome} from "./types";
import Collection from "../models/collection";
import client from "../util/api";

import normalize from "../util/normalize";
import {arrayOf} from "idealizr";
import {game} from "../util/schemas";

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
    let localCollections = await collectionsRepo.find({userId: meId});
    this.push({collections: indexBy(localCollections, "id")});

    const {credentials} = this.store.getState().session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    const {key} = credentials;
    const api = client.withKey(key);
    let normalized;
    try {
      this.debug(`Firing API requests...`);
      normalized = normalize(await api.myGames(), {
        games: arrayOf(game),
      });
    } catch (e) {
      this.debug(`API error:`, e);
      if (client.isNetworkError(e)) {
        return new Outcome("retry");
      } else {
        throw e;
      }
    }

    return new Outcome("success");
  }
}

