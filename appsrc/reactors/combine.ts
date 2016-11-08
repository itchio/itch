
import * as bluebird from "bluebird";
import {map, each} from "underscore";

import {opts} from "../logger";
import mklog from "../util/log";
const log = mklog("reactors");

import {IStore} from "../types";
import {IAction} from "../constants/action-types";

interface IReactor<T> {
  (store: IStore, action: IAction<T>): Promise<void>;
  __combined?: boolean;
}

export default function combine (...args: IReactor<any>[]) {
  const methods = map(args, (x) => {
    if (!x) {
      throw new Error("null reactor in combination");
    }
    if (x.__combined) {
      throw new Error("reactor already combined");
    }
    x.__combined = true;
    return bluebird.method(x);
  });

  return async (store: IStore, action: IAction<any>) => {
    each(methods, async function (method) {
      try {
        await method(store, action);
      } catch (e) {
        log(opts, `while reacting to ${(action || {type: "?"}).type}: ${e.stack || e}`);
      }
    });
  };
}

export interface ICombinator {
  [actionType: string]: IReactor<any>;
  _ALL?: IReactor<any>;
}

export function assertAllCombined (...combinators: ICombinator[]) {
  each(combinators, (combinator, i) => {
    each(Object.keys(combinator), (name) => {
      const reactor = combinator[name];
      if (!reactor.__combined) {
        throw new Error(`in reactor group #${i}, reactor ${name} isn't combined.`);
      }
    });
  });
}
