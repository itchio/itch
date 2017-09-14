import { ITabData, ICredentials, Retry, isRetry } from "../types";
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
  CommonsChanged,
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
    this.ctx = ctx;
    this.tabId = tabId;
    this.reason = reason;

    const sp = this.space();
    this.logger = rootLogger.child({
      name: `${this.constructor.name} :: ${sp.path()}`,
    });

    this.logger.debug(`fetching (${FetchReason[reason]})`);
  }

  tabName(): string {
    return this.space().path();
  }

  async run() {
    this.startedAt = Date.now();

    const { session } = this.ctx.store.getState();
    if (
      !session ||
      !session.credentials ||
      !session.credentials.me ||
      !session.credentials.me.id
    ) {
      this.logger.info(`No credentials yet, skipping`);
      return;
    }

    let retriableError: Error;
    let first = true;
    while (first || retriableError) {
      first = false;
      retriableError = null;

      try {
        await this.work();
      } catch (e) {
        if (isRetry(e)) {
          retriableError = e;
        } else {
          this.logger.error(`Non-retriable error in work:\n${e.stack}`);
          return;
        }
      }

      if (retriableError) {
        this.retryCount++;
        if (this.retryCount > 8) {
          this.logger.error(
            `Too many retries, giving up: ${retriableError.stack}`
          );
          return;
        } else {
          let sleepTime = 100 * Math.pow(2, this.retryCount);
          this.logger.debug(`${retriableError} (${sleepTime}ms)`);
          await bluebird.delay(sleepTime);
        }
      }
    }
  }

  async withApi<T>(cb: (api: AuthenticatedClient) => Promise<T>): Promise<T> {
    const { key } = this.ensureCredentials();
    const api = client.withKey(key);
    try {
      return await cb(api);
    } catch (e) {
      if (isNetworkError(e)) {
        this.retry(e.message);
      } else {
        this.logger.error(`API error: ${e.stack}`);
        throw e;
      }
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
      this.retry("missing credentials");
    }

    return credentials;
  }

  private _space: Space;
  space(): Space {
    if (!this._space) {
      this._space = Space.fromStore(this.ctx.store, this.tabId);
    }
    return this._space;
  }

  pushAllGames(input: IGame[], opts: IPushAllGameOpts = {}) {
    const games = this.sortAndFilter(input);
    this.logger.debug(
      `Pushing games, ${input.length} => (sort+filter) => ${games.length}`
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
