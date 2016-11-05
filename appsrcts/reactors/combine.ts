
import * as bluebird from "bluebird";
import {map, each} from "underscore";

import {opts} from "../logger";
import mklog from "../util/log";
const log = mklog("reactors");

import {IStore, IState} from "../types/db";
import {IAction} from "../constants/action-types";

interface IReducer {
  (state: IState): IState;
  __combined?: boolean;
}

export default function combine (...args: IReducer[]) {
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

  return (store: IStore, action: IAction<any>) => {
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
  [actionType: string]: IReducer;
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
