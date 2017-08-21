import { ITabData, ICredentials } from "../types";
import * as bluebird from "bluebird";
import { indexBy, pluck } from "underscore";

import * as actions from "../actions";

import client, { AuthenticatedClient } from "../api";
import { isNetworkError } from "../net/errors";

import { sortAndFilter } from "./sort-and-filter";
import { IGame } from "../db/models/game";

import Context from "../context";

export enum FetchReason {
  TabChanged,
  TabEvolved,
  TabReloaded,
  WindowFocused,
  TabParamsChanged,
}

import rootLogger, { Logger } from "../logger";
import { Space } from "../helpers/space";

/**
 * Fetches all the data a tab needs to display, except webviews.
 * This can be games, users, etc.
 * Should return info from local DB as soon as possible, and fresh data from
 * API afterwards.
 */
export class Fetcher {
  ctx: Context;
  tabId: string;
  reason: FetchReason;
  aborted = false;

  startedAt: number;
  logger?: Logger;

  retryCount = 0;

  hook(ctx: Context, tabId: string, reason: FetchReason) {
    this.logger = rootLogger.child({ name: this.constructor.name });
    this.ctx = ctx;
    this.tabId = tabId;
    this.reason = reason;

    this.logger.debug(
      `fetching ${this.tabName()} because ${FetchReason[reason]}`,
    );
  }

  tabName(): string {
    return this.space().path();
  }

  async run() {
    this.startedAt = Date.now();

    let shouldRetry = true;
    while (shouldRetry) {
      shouldRetry = false;

      try {
        await this.work();
      } catch (e) {
        if (e instanceof Retry) {
          shouldRetry = true;
        } else {
          this.logger.error(`Non-retriable error in work:\n${e.stack}`);
          return;
        }
      }

      if (shouldRetry) {
        this.retryCount++;
        if (this.retryCount > 8) {
          this.logger.error(`Too many retries, giving up`);
          return;
        } else {
          let sleepTime = 100 * Math.pow(2, this.retryCount);
          this.logger.info(`Sleeping ${sleepTime}ms then retrying...`);
          await bluebird.delay(sleepTime);
        }
      }
    }
  }

  async withApi<T>(cb: (api: AuthenticatedClient) => Promise<T>): Promise<T> {
    const { credentials } = this.ctx.store.getState().session;
    if (!credentials || !credentials.me) {
      this.debug("missing credentials");
      throw new Retry();
    }

    const { key } = credentials;
    const api = client.withKey(key);
    try {
      return await cb(api);
    } catch (e) {
      this.logger.error(`API error:`, e);
      if (isNetworkError(e)) {
        throw new Retry();
      } else {
        throw e;
      }
    }
  }

  async doRetry() {
    this.retryCount++;
    if (this.retryCount > 8) {
      throw new Error(`Too many retries, giving up`);
    } else {
      let sleepTime = 100 * Math.pow(2, this.retryCount);
      this.logger.info(`Sleeping ${sleepTime}ms then retrying...`);
      await bluebird.delay(sleepTime);
      await this.run();
    }
  }

  /**
   * Overriden by sub classes, actual fetch logic goes here
   * Ideally, should listen for "abort" on `this.emitter` and react accordingly
   */
  async work(): Promise<void> {
    throw new Error(`fetchers should override work()!`);
  }

  /**
   * Called by work when data is available.
   */
  push(data: ITabData) {
    if (this.ctx.isDead()) {
      return;
    }

    const action = actions.tabDataFetched({
      tab: this.tabId,
      data,
    });
    this.ctx.store.dispatch(action);
  }

  retry(why: string) {
    throw new Retry(why);
  }

  debug(msg: string, ...args: any[]) {
    this.logger.info(msg, ...args);
  }

  warrantsRemote(reason: FetchReason) {
    switch (reason) {
      case FetchReason.TabParamsChanged:
        return false;
      default:
        return true;
    }
  }

  ensureCredentials(): ICredentials {
    const { credentials } = this.ctx.store.getState().session;
    if (!credentials || !credentials.me) {
      this.debug(`missing credentials`);
      throw new Retry();
    }

    return credentials;
  }

  private _space: Space;
  space(): Space {
    if (!this._space) {
      this._space = Space.for(this.ctx.store, this.tabId);
    }
    return this._space;
  }

  pushAllGames(input: IGame[], opts: IPushAllGameOpts = {}) {
    const games = this.sortAndFilter(input);
    this.logger.debug(
      `Pushing games, ${input.length} => (sort+filter) => ${games.length}`,
    );

    const gameIds = pluck(games, "id");
    const totalCount = opts.totalCount || input.length;
    gameIds.length = totalCount;

    this.push({
      games: {
        set: indexBy(games, "id"),
        ids: gameIds,
        hiddenCount: input.length - games.length,
      },
    });
  }

  pushGames(opts: IPushGamesOpts) {
    const { range, totalCount } = opts;

    this.push({
      games: {
        set: indexBy(range, "id"),
        ids: pluck(range, "id"),
        hiddenCount: totalCount - range.length,
      },
    });
  }

  sortAndFilter(input: IGame[]): IGame[] {
    return sortAndFilter(input, this.tabId, this.ctx.store);
  }
}

interface IPushGamesOpts {
  getFilteredCount: () => number;
  totalCount: number;
  range: IGame[];
}

interface IPushAllGameOpts {
  totalCount?: number;
}

export class Retry extends Error {
  constructor(detail = "no details") {
    super(`Retry: ${detail}`);
  }
}
