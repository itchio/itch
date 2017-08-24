import { IStore } from "../types";
import { IAction } from "../constants/action-types";
import * as actionTypes from "../constants/action-types";

import { each } from "underscore";

import debounce from "./debounce";

export interface IReactor<T> {
  (store: IStore, action: IAction<T>): Promise<void>;
}

/**
 * Allows reacting to certain actions being dispatched
 */
export class Watcher {
  reactors: {
    [key: string]: IReactor<any>[];
    _ALL?: IReactor<any>[];
    _MOUNT?: IReactor<any>[];
  };

  subs: Watcher[];

  constructor() {
    this.reactors = {};
    this.subs = [];
  }

  /**
   * Registers a reactor for all action types, ever
   */
  onAll(reactor: (store: IStore, action: IAction<any>) => Promise<void>) {
    this.addWatcher("_ALL", reactor);
  }

  /**
   * Registers a reactor for when this watcher is mounted
   */
  onMount(reactor: (store: IStore, action: IAction<void>) => Promise<void>) {
    this.addWatcher("__MOUNT", reactor);
  }

  /**
   * Registers a reactor for a given action
   */
  on<T>(
    actionCreator: (payload: T) => IAction<T>,
    reactor: (store: IStore, action: IAction<T>) => Promise<void>
  ) {
    // create a dummy action to get the type
    const type = actionCreator(({} as any) as T).type;
    this.addWatcher(type, reactor);
  }

  onDebounced<T>(
    actionCreator: (payload: T) => IAction<T>,
    ms: number,
    reactor: (store: IStore, action: IAction<T>) => Promise<void>
  ) {
    // create a dummy action to get the type
    const type = actionCreator(({} as any) as T).type;
    this.addWatcher(type, debounce(reactor, ms));
  }

  validate() {
    each(Object.keys(this.reactors), key => {
      if (key === "_ALL" || key === "__MOUNT") {
        return;
      }
      if (!actionTypes.hasOwnProperty(key)) {
        throw new Error(`trying to react to unknown action type ${key}`);
      }
    });
  }

  addSub(watcher: Watcher) {
    this.subs.push(watcher);
  }

  removeSub(watcher: Watcher) {
    const index = this.subs.indexOf(watcher);
    if (index !== -1) {
      this.subs.splice(index, 1);
    }
  }

  protected addWatcher(type: string, reactor: IReactor<any>) {
    if (!this.reactors[type]) {
      this.reactors[type] = [];
    }
    this.reactors[type].push(reactor);
  }
}
