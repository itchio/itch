
import pathmaker from "../util/pathmaker";

import * as actions from "../actions";

import Market from "../util/market";

let userMarket: Market = null;

import mklog from "../util/log";
import {opts} from "../logger";
const log = mklog("navigation");

import {IStore} from "../types";

import {
  IAction,
  IDbCommitPayload,
  ILogoutPayload,
} from "../constants/action-types";

// abstraction leak but helps halving the bandwidth between browser and renderer:
// the reducer can just pick data from here instead of getting it from the message,
// which would also be serialized & sent by JSON
export function getUserMarket () {
  if (!userMarket) {
    throw new Error("called getUserMarket before market initialization");
  }
  return userMarket;
}

let globalMarket: Market = null;

export function getGlobalMarket () {
  if (!globalMarket) {
    throw new Error("called getGlobalMarket before market initialization");
  }
  return globalMarket;
}

async function firstWindowReady (store: IStore, action: IAction<any>) {
  globalMarket = new Market();

  globalMarket.on("ready", () => {
    store.dispatch(actions.globalDbReady());
  });

  globalMarket.on("commit", (payload: IDbCommitPayload) => {
    store.dispatch(actions.globalDbCommit(payload));
  });

  await globalMarket.load(pathmaker.globalDbPath());
}

const createQueue = (store: IStore, name: string) => {
  let open = true;
  return {
    dispatch: (action: IAction<any>) => {
      if (open) {
        store.dispatch(action);
      }
    },
    close: () => {
      open = false;
    },
  };
};

async function loginSucceeded (store: IStore, action: IAction<any>) {
  const queue = createQueue(store, "user-market");

  const {me} = action.payload;
  userMarket = new Market();

  userMarket.on("ready", () => {
    log(opts, "got user db ready");
    queue.dispatch(actions.userDbReady());
  });

  userMarket.on("commit", (payload: IDbCommitPayload) => {
    queue.dispatch(actions.userDbCommit(payload));
  });

  userMarket.on("close", () => {
    log(opts, "got user db close");
    queue.close();
    store.dispatch(actions.userDbClosed());
  });

  await userMarket.load(pathmaker.userDbPath(me.id));
}

async function logout (store: IStore, action: IAction<ILogoutPayload>) {
  if (userMarket) {
    log(opts, "closing user db");
    userMarket.close();
    userMarket = null;
  } else {
    log(opts, "no user db to close");
  }
}

export default {firstWindowReady, loginSucceeded, logout};
