import * as zopf from "zopf";
import * as fs from "fs";

import { relative } from "path";

const basePath = __dirname;
const emptyArr = [];

interface ISuite {
  case: (name: string, cb: (t: Zopf.ITest) => void | Promise<void>) => void;
}

export default function suite(filename: string, cb: (s: ISuite) => void) {
  if (!fs.existsSync(filename)) {
    throw new Error(
      `incorrect usage of suite() - should pass __filename, got ${JSON.stringify(
        filename
      )}`
    );
  }

  const name = relative(basePath, filename)
    .replace(/\\/g, "/")
    .replace(/\.spec\.ts$/, "")
    .replace(/\/index$/, "/");

  zopf(name, cb);
}

/** A watcher made for testing reactors */
import { Watcher } from "./reactors/watcher";
import { IStore, IAction } from "./types";
import { createStore } from "redux";
import reducer from "./reducers";
import { actions } from "./actions";

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
export async function immediate() {
  await new Promise((resolve, reject) => {
    setImmediate(resolve);
  });
}
