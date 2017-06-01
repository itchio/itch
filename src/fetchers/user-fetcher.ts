
import {Fetcher, Outcome, OutcomeState} from "./types";

import db from "../db";
import User from "../db/models/user";

import client from "../api";
import normalize from "../api/normalize";
import {user} from "../api/schemas";
import {isNetworkError} from "../net/errors";

import {pathToId, userToTabData} from "../util/navigation";

export default class UserFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    const tabData = this.store.getState().session.tabData[this.tabId];
    if (!tabData) {
      return null;
    }

    const {path} = tabData;

    const userId = +pathToId(path);

    const userRepo = db.getRepo(User);
    let localUser = await userRepo.findOneById(userId);
    let pushUser = (user: User) => {
      if (!user) {
        return;
      }
      this.push(userToTabData(user));
    };
    pushUser(localUser);

    const {credentials} = this.store.getState().session;
    if (!credentials) {
      throw new Error(`No user credentials yet`);
    }

    const {key} = credentials;
    const api = client.withKey(key);
    let normalized;
    try {
      this.debug(`Firing API requests...`);
      normalized = normalize(await api.user(userId), {
        user: user,
      });
    } catch (e) {
      this.debug(`API error:`, e);
      if (isNetworkError(e)) {
        return new Outcome(OutcomeState.Retry);
      } else {
        throw e;
      }
    }

    this.debug(`normalized: `, normalized);
    pushUser(normalized.entities.users[normalized.result.userId]);

    return new Outcome(OutcomeState.Success);
  }
}


