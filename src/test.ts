import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { assert } = chai;
import "mocha";

process.env.NODE_ENV = "test";

const _describe = describe;
const _it = it;
export { _describe as describe, _it as it, assert };

const emptyArr = [];

/** A watcher made for testing reactors */
import { Watcher } from "./reactors/watcher";
import { IStore, IAction } from "./types";
import { createStore } from "redux";
import reducer from "./reducers";
import { actions } from "./actions";
import { ItchPromise } from "./util/itch-promise";

export class TestWatcher extends Watcher {
  store: IStore;
  p: Promise<void>;

  constructor() {
    super();
    this.store = createStore(reducer, {}) as IStore;
    const storeDotDispatch = this.store.dispatch;
    this.store.dispatch = <A extends IAction<any>>(action: A): A => {
      storeDotDispatch(action);
      this.p = this.routeInternal(action);
      return action;
    };
  }

  async dispatch(action: IAction<any>) {
    this.store.dispatch(action);
    await this.p;
    this.p = null;
  }

  async dispatchAndWaitImmediate(action: IAction<any>) {
    await this.dispatch(action);
    await this.dispatch(actions.tick({}));
    await immediate();
  }

  protected async routeInternal(action: IAction<any>) {
    for (const type of [action.type]) {
      for (const reactor of this.reactors[type] || emptyArr) {
        await reactor(this.store, action);
      }
    }
  }
}

/**
 * Returns a promise that resolves when setImmediate's callback is called
 * Some parts of the code (reactors for example) use setImmediate to avoid
 * infinite recursion.
 */
async function immediate() {
  await new ItchPromise((resolve, reject) => {
    setImmediate(resolve);
  });
}
