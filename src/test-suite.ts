import * as zopf from "zopf";
import * as fs from "fs";
import { join, resolve } from "path";

import { relative } from "path";

import { ILocalizer } from "./localizer";

const basePath = __dirname;

interface ISuite {
  case: (name: string, cb: (t: Zopf.ITest) => void | Promise<void>) => void;
}

export default function suite(filename: string, cb: (s: ISuite) => void) {
  if (!fs.existsSync(filename)) {
    throw new Error(
      `incorrect usage of suite() - should pass __filename, got ${JSON.stringify(
        filename,
      )}`,
    );
  }

  const name = relative(basePath, filename)
    .replace(/\\/g, "/")
    .replace(/\.spec\.ts$/, "")
    .replace(/\/index$/, "/");

  zopf(name, cb);
}

const fixturesPath = resolve(__dirname, "..", "fixtures");

export const fixture = {
  path: function(spec: string) {
    return join(fixturesPath, `files/${spec}`);
  },

  lines: function(spec: string, file: string): string[] {
    return fs
      .readFileSync(join(fixturesPath, `files/${spec}/${file}.txt`), {
        encoding: "utf8",
      })
      .split("\n");
  },

  json: function(spec: string): any {
    const path = join(fixturesPath, `${spec}.json`);
    return JSON.parse(fs.readFileSync(path, { encoding: "utf8" }));
  },

  api: function(spec: string) {
    return fixture.json(`api/${spec}`);
  },
};

/**
 * A dummy localizer that just returns the identity
 */
export const localizer = ({
  format: (x: any[]) => x,
} as any) as ILocalizer;

/** A watcher made for testing reactors */
import { Watcher } from "./reactors/watcher";
import { IStore } from "./types";
import { IAction } from "./constants/action-types";
import { createStore } from "redux";
import reducer from "./reducers";

import * as allActions from "./actions";
export const actions = allActions;

export class TestWatcher extends Watcher {
  store: IStore;
  p: Promise<void>;

  constructor() {
    super();
    this.store = createStore(reducer, {}) as IStore;
    const storeDotDispatch = this.store.dispatch;
    this.store.dispatch = (action: IAction<any>) => {
      storeDotDispatch(action);
      this.p = this.routeInternal(action);
    };
  }

  async dispatch(action: IAction<any>) {
    this.store.dispatch(action);
    await this.p;
    this.p = null;
  }

  protected async routeInternal(action: IAction<any>) {
    const reactors = this.reactors[action.type];
    if (reactors) {
      for (const reactor of reactors) {
        await reactor(this.store, action);
      }
    }
  }
}

import { DB } from "./db";

let oldDB: DB;
export async function loadDB(db: DB, store: IStore) {
  if (oldDB) {
    await oldDB.conn.close();
    oldDB = null;
  }

  await db.load(store, ":memory:");
  oldDB = db;
}
