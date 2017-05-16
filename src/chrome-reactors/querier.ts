
import {Watcher} from "./watcher";
import {IStore} from "../types";
import * as actions from "../actions";

const debug = require("debug")("itch:querier");

export type LoadSource = "cavesByGameId" | "downloadKeysByGameId";

import DownloadKey from "../models/download-key";
import Cave from "../models/cave";

import {groupBy} from "underscore";

import {ILiberateQueryPayload, IRegisterQueryPayload} from "../action-types";

export interface IQuery {
  source: LoadSource;
  query: number | string;
}

export interface IQueryTable {
  [propName: string]: IQuery;
}

interface IQueryRegister {
  [loadId: number]: IQueryTable;
}

const queryRegister: IQueryRegister = {};

let timeout: any;
let promise: any;

async function updateCavesByGameId(store: IStore, watcher: Watcher, gameIds: string[]) {
  const {globalMarket} = watcher.getMarkets();
  if (!globalMarket) {
    return;
  }

  const caves = await globalMarket.getRepo(Cave)
    .createQueryBuilder("c")
    .where("c.gameId in (:gameIds)", {gameIds})
    .getMany();

  store.dispatch(actions.fetchedQuery({
    data: {
      cavesByGameId: groupBy(caves, "gameId"),
    },
  }));
}

async function updateDownloadKeysByGameId(store: IStore, watcher: Watcher, gameIds: string[]) {
  const {market} = watcher.getMarkets();
  if (!market) {
    return;
  }
  const downloadKeys = await market.getRepo(DownloadKey)
    .createQueryBuilder("dk")
    .where("dk.gameId in (:gameIds)", {gameIds})
    .getMany();

  store.dispatch(actions.fetchedQuery({
    data: {
      downloadKeysByGameId: groupBy(downloadKeys, "gameId"),
    },
  }));
}

// TODO: a lot of smart things we can do here for performance
// but let's do the dumbest working thing first
async function runQueries(store: IStore, watcher: Watcher) {
  if (!timeout) {
    timeout = setTimeout(() => {
      actuallyRunQueries(store, watcher).catch((error) => {
        debug(`While running queries:`, error);
      }).then(() => timeout = null);
    }, 300);
  }
}

let added: IRegisterQueryPayload[] = [];
let deleted: ILiberateQueryPayload[] = [];

async function actuallyRunQueries(store: IStore, watcher: Watcher) {
  debug(`${added} added, ${deleted} deleted`);
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
    const flattened: {
      [key: string]: {
        [key: string]: boolean;
      };
    } = {};

    for (const loadId of Object.keys(queryRegister)) {
      const queries = queryRegister[loadId];
      for (const propName of Object.keys(queries)) {
        const {query, source} = queries[propName];
        if (!flattened[source]) {
          flattened[source] = {};
        }
        flattened[source][query] = true;
      }
    }

    if (flattened["cavesByGameId"]) {
      await updateCavesByGameId(store, watcher, Object.keys(flattened["cavesByGameId"]));
    }
    if (flattened["downloadKeysByGameId"]) {
      await updateDownloadKeysByGameId(store, watcher, Object.keys(flattened["downloadKeysByGameId"]));
    }
  })();
  await promise;
  promise = null;
  debug(`done running queries`);
}

// TODO: this looks suspiciously like a reducer, maybe some of it belongs in the state instead?
export default function (watcher: Watcher) {
  watcher.on(actions.registerQuery, async (store, action) => {
    added.push(action.payload);
    await runQueries(store, watcher);
  });

  watcher.on(actions.liberateQuery, async (store, action) => {
    deleted.push(action.payload);
    await runQueries(store, watcher);
  });
}
