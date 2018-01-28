import { ITabData, ICredentials, Retry, isRetry } from "../types";
import * as bluebird from "bluebird";
import { indexBy, pluck } from "underscore";

import * as actions from "../actions";

import defaultApiClient, { AuthenticatedClient, Client } from "../api";
import { isNetworkError } from "../net/errors";

import { sortAndFilter } from "./sort-and-filter";

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
import { Game } from "ts-itchio-api";

interface OptionalFetcherParams {
  apiClient?: Client;
}

/**
 * Fetches all the data a tab needs to display, except webviews.
 * This can be games, users, etc.
 * Should return info from local DB as soon as possible, and fresh data from
 * API afterwards.
 */
export class Fetcher {
  ctx: Context;
  tab: string;
  reason: FetchReason;
  aborted = false;

  startedAt: number;
  logger?: Logger;
  apiClient: Client;

  retryCount = 0;

  hook(
    ctx: Context,
    tab: string,
    reason: FetchReason,
    params: OptionalFetcherParams = {}
  ) {
    this.ctx = ctx;
    this.tab = tab;
    this.reason = reason;
    this.apiClient = params.apiClient || defaultApiClient;

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
    const api = this.apiClient.withKey(key);
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

  async withLoading<T>(cb: () => Promise<T>): Promise<T> {
    this.ctx.store.dispatch(
      actions.tabLoading({ tab: this.tab, loading: true })
    );
    try {
      return await cb();
    } finally {
      this.ctx.store.dispatch(
        actions.tabLoading({ tab: this.tab, loading: false })
      );
    }
  }

  /**
   * Called by work when data is available.
   */
  push(data: ITabData, { shallow }: { shallow: boolean } = { shallow: false }) {
    if (this.ctx.isDead()) {
      return;
    }

    const payload = {
      tab: this.tab,
      data,
      shallow,
    };
    const action = actions.tabDataFetched(payload);
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
      this._space = Space.fromStore(this.ctx.store, this.tab);
    }
    return this._space;
  }

  pushAllGames(input: Game[], opts: IPushAllGameOpts = {}) {
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

  sortAndFilter(input: Game[]): Game[] {
    return sortAndFilter(input, this.tab, this.ctx.store);
  }

  clean() {
    this.logger.warn(`clean(): stub!`);
  }
}

interface IPushGamesOpts {
  getFilteredCount: () => number;
  totalCount: number;
  range: Game[];
}

interface IPushAllGameOpts {
  totalCount?: number;
}
