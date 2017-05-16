
import {Watcher} from "./watcher";
import {IStore} from "../types";
import * as actions from "../actions";

const debug = require("debug")("itch:querier");

export type LoadSource = "cavesByGameId" | "downloadKeysByGameId";

import DownloadKey from "../models/download-key";
import Cave from "../models/cave";

import {groupBy} from "underscore";

import {ILiberateQueryPayload, IRegisterQueryPayload} from "../constants/action-types";

export interface IQuery {
  source: LoadSource;
  query: number | string;
}

export type IQueryList = IQuery[];

interface IQueryRegister {
  [loadId: number]: IQueryList;
}

const queryRegister: IQueryRegister = {};

let timeout: any;
let promise: any;

let cavesDbTime = 0;
let keysDbTime = 0;

async function updateCavesByGameId(store: IStore, watcher: Watcher, gameIds: string[]) {
  const {globalMarket} = watcher.getMarkets();
  if (!globalMarket) {
    return {};
  }

  const t1 = Date.now();
  const caves = await globalMarket.getRepo(Cave)
    .createQueryBuilder("c")
    .where("c.gameId in (:gameIds)", {gameIds})
    .getMany();
  const t2 = Date.now();
  cavesDbTime = t2 - t1;

  return groupBy(caves, "gameId");
}

async function updateDownloadKeysByGameId(store: IStore, watcher: Watcher, gameIds: string[]) {
  const {market} = watcher.getMarkets();
  if (!market) {
    return {};
  }

  const t1 = Date.now();
  const downloadKeys = await market.getRepo(DownloadKey)
    .createQueryBuilder("dk")
    .where("dk.gameId in (:gameIds)", {gameIds})
    .getMany();
  const t2 = Date.now();
  keysDbTime = t2 - t1;

  return groupBy(downloadKeys, "gameId");
}

// TODO: a lot of smart things we can do here for performance
// but let's do the dumbest working thing first
function runQueries(store: IStore, watcher: Watcher) {
  if (!timeout) {
    timeout = setTimeout(() => {
      actuallyRunQueries(store, watcher).catch((error) => {
        debug(`While running queries:`, error);
      }).then(() => timeout = null);
    }, 50);
  }
}

let added: IRegisterQueryPayload[] = [];
let deleted: ILiberateQueryPayload[] = [];

async function actuallyRunQueries(store: IStore, watcher: Watcher) {
  while (deleted.length > 0) {
    const {loadId} = deleted.shift();
    delete queryRegister[loadId];
  }
  while (added.length > 0) {
    const {loadId, query} = added.shift();
    queryRegister[loadId] = query;
  }

  debug(`running queries...`);
  promise = (async function() {
    const t1 = Date.now();
    const flattened: {
      [key: string]: {
        [key: string]: boolean;
      };
    } = {};

    for (const loadId of Object.keys(queryRegister)) {
      const queries = queryRegister[loadId];
      for (const {query, source} of queries) {
        if (!flattened[source]) {
          flattened[source] = {};
        }
        flattened[source][query] = true;
      }
    }
    const t2 = Date.now();

    let cavesByGameId = {};
    if (flattened["cavesByGameId"]) {
      cavesByGameId = await updateCavesByGameId(
        store, watcher, Object.keys(flattened["cavesByGameId"]));
    }
    const t3 = Date.now();
    let downloadKeysByGameId = {};
    if (flattened["downloadKeysByGameId"]) {
      downloadKeysByGameId = await updateDownloadKeysByGameId(
         store, watcher, Object.keys(flattened["downloadKeysByGameId"]));
    }
    const t4 = Date.now();

    store.dispatch(actions.fetchedQuery({
      data: {
        cavesByGameId,
        downloadKeysByGameId,
      },
    }));
    const t5 = Date.now();
    debug(`flatten ${(t2 - t1).toFixed(2)}ms, caves ${(t3 - t2).toFixed(2)}ms, downloadKeys ${(t4 - t3).toFixed(2)}ms`
     + `\ndispatch ${(t5 - t4).toFixed(2)}ms`
     + `\ncaves db: ${cavesDbTime.toFixed(2)}ms, keys db: ${keysDbTime.toFixed(2)}ms`);
  })();
  await promise;
  promise = null;
}

// TODO: this looks suspiciously like a reducer, maybe some of it belongs in the state instead?
export default function (watcher: Watcher) {
  watcher.on(actions.registerQuery, async (store, action) => {
    added.push(action.payload);
    runQueries(store, watcher);
  });

  watcher.on(actions.liberateQuery, async (store, action) => {
    deleted.push(action.payload);
    runQueries(store, watcher);
  });
}
