import { IStore, ITabData, ICredentials } from "../types";

import * as actions from "../actions";
import { EventEmitter } from "events";

import client, { AuthenticatedClient } from "../api";
import { isNetworkError } from "../net/errors";

export enum FetchReason {
  TabChanged,
  TabEvolved,
  TabReloaded,
  WindowFocused,
  TabParamsChanged,
  TabPaginationChanged,
}

import rootLogger, { Logger } from "../logger";

const emptyObj = {};

/**
 * Fetches all the data a tab needs to display, except webviews.
 * This can be games, users, etc.
 * Should return info from local DB as soon as possible, and fresh data from
 * API afterwards.
 */
export class Fetcher {
  store: IStore;
  tabId: string;
  reason: FetchReason;
  aborted = false;

  emitter: EventEmitter;
  startedAt: number;

  logger?: Logger;

  prevData?: ITabData;

  retryCount = 0;

  hook(store: IStore, tabId: string, reason: FetchReason) {
    this.logger = rootLogger.child({ name: this.constructor.name });
    this.store = store;
    this.tabId = tabId;
    this.reason = reason;

    this.emitter = new EventEmitter();
    this.emitter.on("abort", () => {
      this.aborted = true;
    });

    this.prevData = store.getState().session.tabData[tabId];
  }

  start() {
    this.startedAt = Date.now();
    this.work()
      .then(outcome => {
        if (isOutcome(outcome)) {
          switch (outcome.state) {
            case OutcomeState.Success:
              this.emitter.emit("done");
              break;
            case OutcomeState.Retry:
              this.doRetry();
              break;
            default:
              this.logger.info(
                `Fetcher returned unknown outcome state ${outcome.state}`,
              );
              this.emitter.emit("done");
              break;
          }
        } else {
          this.emitter.emit("done");
        }
      })
      .catch(e => {
        if (e instanceof BrutalRetry) {
          this.doRetry();
        } else {
          this.logger.error(`Error in work:\n${e.stack}`);
          this.emitter.emit("done");
        }
      });
  }

  async withApi<T>(cb: (api: AuthenticatedClient) => Promise<T>): Promise<T> {
    const { credentials } = this.store.getState().session;
    if (!credentials || !credentials.me) {
      this.debug("missing credentials");
      throw new BrutalRetry();
    }

    const { key } = credentials;
    const api = client.withKey(key);
    try {
      return await cb(api);
    } catch (e) {
      this.logger.error(`API error:`, e);
      if (isNetworkError(e)) {
        throw new BrutalRetry();
      } else {
        throw e;
      }
    }
  }

  doRetry() {
    this.retryCount++;
    if (this.retryCount > 8) {
      throw new Error(`Too many retries, giving up`);
    } else {
      let sleepTime = 100 * Math.pow(2, this.retryCount);
      this.logger.info(`Sleeping ${sleepTime}ms then retrying...`);
      setTimeout(() => {
        this.start();
      }, sleepTime);
    }
  }

  /**
   * Overriden by sub classes, actual fetch logic goes here
   * Ideally, should listen for "abort" on `this.emitter` and react accordingly
   */
  async work(): Promise<Outcome> {
    throw new Error(`fetchers should override work()!`);
  }

  /**
   * Called by work when data is available.
   */
  push(data: ITabData) {
    if (this.aborted) {
      return;
    }

    const action = actions.tabDataFetched({
      id: this.tabId,
      data,
    });
    this.store.dispatch(action);
  }

  cancel() {
    if (this.aborted) {
      // already cancelled
      this.logger.warn(`Fetch for ${this.tabId} cancelled twice`);
      return;
    }
    this.emitter.emit("abort");
  }

  retry() {
    return new Outcome(OutcomeState.Retry);
  }

  success() {
    return new Outcome(OutcomeState.Success);
  }

  debug(msg: string, ...args: any[]) {
    this.logger.info(msg, ...args);
  }

  warrantsRemote(reason: FetchReason) {
    switch (reason) {
      case FetchReason.TabPaginationChanged:
      case FetchReason.TabParamsChanged:
        return false;
      default:
        return true;
    }
  }

  ensureCredentials(): ICredentials {
    const { credentials } = this.store.getState().session;
    if (!credentials || !credentials.me) {
      this.debug(`missing credentials`);
      throw new BrutalRetry();
    }

    return credentials;
  }

  tabData(): ITabData {
    return this.store.getState().session.tabData[this.tabId] || emptyObj;
  }
}

export enum OutcomeState {
  Success,
  Retry,
}

export class BrutalRetry extends Error {
  constructor() {
    super("BrutalRetry");
  }
}

export class Outcome {
  constructor(public state: OutcomeState) {
    // muffin
  }
}

function isOutcome(o: any): o is Outcome {
  return o instanceof Outcome;
}
