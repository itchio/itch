import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { assert } = chai;
import "mocha";

import env from "common/env";
env.unitTests = true;

const _describe = describe;
const _it = it;
export { _describe as describe, _it as it, assert };

const emptyArr: any[] = [];

/** A watcher made for testing reactors */
import { createStore } from "redux";
import { Watcher } from "common/util/watcher";
import { Store, Action } from "common/types";
import reducer from "common/reducers";
import { actions } from "common/actions";
import { Logger } from "common/logger";

export class TestWatcher extends Watcher {
  store: Store;
  p: Promise<void> | null;

  constructor() {
    super(new Logger({ write: entry => {} }));
    this.store = createStore(reducer, {} as any) as Store;
    const storeDotDispatch = this.store.dispatch;
    this.store.dispatch = <A extends Action<any>>(action: A): A => {
      storeDotDispatch(action);
      this.p = this.routeInternal(action);
      return action;
    };
  }

  async dispatch(action: Action<any>) {
    this.store.dispatch(action);
    await this.p;
    this.p = null;
  }

  async dispatchAndWaitImmediate(action: Action<any>) {
    await this.dispatch(action);
    await this.dispatch(actions.tick({}));
    await immediate();
  }

  protected async routeInternal(action: Action<any>) {
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
  await new Promise((resolve, reject) => {
    setImmediate(resolve);
  });
}
