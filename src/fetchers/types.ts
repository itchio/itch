
import {IStore, IMarket, ITabData} from "../types";

import * as actions from "../actions";
import {EventEmitter} from "events";
const makeDebug = require("debug");

const deepEqual = require("deep-equal");
export type FetchReason = "tab-changed" | "tab-evolved" | "tab-reloaded" | "window-focused";

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
  getMarkets: IMarketGetter;
  aborted = false;

  emitter: EventEmitter;
  startedAt: number;

  debug?: any;

  prevData?: ITabData;

  retryCount = 0;

  hook(store: IStore, tabId: string, reason: FetchReason, getMarkets: IMarketGetter) {
    this.debug = makeDebug(`itch:tab-fetcher:${tabId}:${reason}`);
    this.store = store;
    this.tabId = tabId;
    this.reason = reason;
    this.getMarkets = getMarkets;

    this.emitter = new EventEmitter();
    this.emitter.on("abort", () =>  {
      this.aborted = true;
    });
  }

  start() {
    this.startedAt = Date.now();
    this.debug(`Starting work...`);
    this.work().then((outcome) => {
      if (isOutcome(outcome)) {
        switch (outcome.state) {
          case "success":
            this.debug(`Success!`);
            this.emitter.emit("done");
            break;
          case "retry":
            this.retryCount++;  
            if (this.retryCount > 8) {
              throw new Error(`Too many retries, giving up`);
            } else {
              let sleepTime = 100 * Math.pow(2, this.retryCount);
              this.debug(`Sleeping ${sleepTime}ms then retrying...`);
              setTimeout(() => {
                this.start();
              }, sleepTime);
            }
            break;
          default:
            this.debug(`Fetcher returned unknown outcome state ${outcome.state}`);
            this.emitter.emit("done");
            break;
        }
      } else {
        this.debug(`Fetcher did not return any outcome`);
        this.emitter.emit("done");
      }
    }).catch((e) => {
      this.debug(`Error in work:\n${e.stack}`);
      this.emitter.emit("done");
    });
  }

  /**
   * Overriden by sub classes, actual fetch logic goes here
   * Ideally, should listen for "abort" on `this.emitter` and react accordingly
   */
  async work (): Promise<Outcome> {
    throw new Error(`fetchers should override work()!`);
  }

  /**
   * Called by work when data is available.
   */
  push (data: ITabData) {
    if (this.aborted) {
      this.debug(`we're cancelled, suppressing push`);
    }

    if (this.prevData && deepEqual(this.prevData)) {
      this.debug(`push ignoring duplicate data`);
      return;
    }

    this.debug(`push got fresh data!`, data);
    this.prevData = data;
    const timestamp = Date.now();

    const action = actions.tabDataFetched({
      id: this.tabId,
      timestamp,
      data,
    });
    this.store.dispatch(action);
  }

  cancel() {
    if (this.aborted) {
      // already cancelled
      this.debug(`Fetch for ${this.tabId}`);
      return;
    }
    this.emitter.emit("abort");
  }

  retry() {
    return new Outcome("retry");
  }
}

export interface IMarkets {
  market?: IMarket;
  globalMarket?: IMarket;
}

export type IMarketGetter = () => IMarkets;

export type OutcomeState = "success" | "retry";

export class Outcome {
  constructor (public state: OutcomeState) {
    // muffin
  }
}

function isOutcome(o: any): o is Outcome {
  return o instanceof Outcome;
}
