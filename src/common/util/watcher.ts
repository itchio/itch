import { Store, RootState, Action } from "common/types";

import { each } from "underscore";

import debounce from "common/util/debounce";

import { Logger } from "common/logger";
import { actions } from "common/actions";

interface IReactor<T> {
  (store: Store, action: Action<T>): Promise<void>;
}

interface Schedule {
  (f: () => void): void;
  dispatch?: (a: Action<any>) => void;
}
type Selector = (rs: RootState) => void;
type SelectorMaker = (store: Store, schedule: Schedule) => Selector;

/**
 * Allows reacting to certain actions being dispatched
 */
export class Watcher {
  logger: Logger;
  reactors: {
    [key: string]: IReactor<any>[];
  };

  subs: Watcher[];

  constructor(logger: Logger) {
    this.logger = logger;
    this.reactors = {};
    this.subs = [];
  }

  /**
   * Registers a lazily-created reselect selector that will be called
   * on every tick if the state has changed since the last tick
   */
  onStateChange({ makeSelector }: { makeSelector: SelectorMaker }) {
    let oldRs: RootState = null;
    let selector: Selector;

    const actionName = "tick";
    this.addWatcher(actionName, async (store, action) => {
      let rs = store.getState();
      if (rs === oldRs) {
        return;
      }
      oldRs = rs;

      if (!selector) {
        const schedule: Schedule = (f) => {
          setImmediate(() => {
            try {
              f();
            } catch (e) {
              this.logger.error(`In scheduled stateChange: ${e.stack}`);
            }
          });
        };
        schedule.dispatch = (action: Action<any>) => {
          schedule(() => store.dispatch(action));
        };
        selector = makeSelector(store, schedule);
      }

      try {
        selector(rs);
      } catch (e) {
        this.logger.error(`In state selector: ${e.stack}`);
      }
    });
  }

  /**
   * Registers a reactor for a given action
   */
  on<T>(
    actionCreator: (payload: T) => Action<T>,
    reactor: (store: Store, action: Action<T>) => Promise<void>
  ) {
    // create a dummy action to get the type
    const type = actionCreator(({} as any) as T).type;
    this.addWatcher(type, reactor);
  }

  onDebounced<T>(
    actionCreator: (payload: T) => Action<T>,
    ms: number,
    reactor: (store: Store, action: Action<T>) => Promise<void>
  ) {
    // create a dummy action to get the type
    const type = actionCreator(({} as any) as T).type;
    this.addWatcher(type, debounce(reactor, ms));
  }

  validate() {
    each(Object.keys(this.reactors), (key) => {
      if (!actions.hasOwnProperty(key)) {
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
