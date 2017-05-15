
import {Watcher} from "./watcher";
import {IStore} from "../types";
import * as actions from "../actions";

const debug = require("debug")("itch:querier");

export type LoadSource = "cavesByGameId" | "downloadKeysByGameId";

import DownloadKey from "../models/download-key";
import Cave from "../models/cave";

import {groupBy} from "underscore";

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

async function updateCavesByGameId(store: IStore, watcher: Watcher, gameIds: string[]) {
  const {globalMarket} = watcher.getMarkets();
  if (!globalMarket) {
    debug(`no market, not fetching caves by game id`);
  }

  debug(`caves gameIds = `, gameIds);

  const caves = await globalMarket.getRepo(Cave)
    .createQueryBuilder("c")
    .where("c.gameId in (:gameIds)", {gameIds})
    .getMany();

  debug(`got caves `, caves);

  store.dispatch(actions.fetchedQuery({
    data: {
      cavesByGameId: groupBy(caves, "gameId"),
    },
  }));
}

async function updateDownloadKeysByGameId(store: IStore, watcher: Watcher, gameIds: string[]) {
  debug(`downloadKeys gameIds = `, gameIds);

  const {market} = watcher.getMarkets();
  if (!market) {
    debug(`no market, not fetching download keys by game id`);
  }
  const downloadKeys = await market.getRepo(DownloadKey)
    .createQueryBuilder("dk")
    .where("dk.gameId in (:gameIds)", {gameIds})
    .getMany();

  debug(`got downloadKeys: `, downloadKeys);

  store.dispatch(actions.fetchedQuery({
    data: {
      downloadKeysByGameId: groupBy(downloadKeys, "gameId"),
    },
  }));
}

// TODO: a lot of smart things we can do here for performance
// but let's do the dumbest working thing first
async function runQueries(store: IStore, watcher: Watcher) {
  debug(`running queries... register = `, queryRegister);

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
}

// TODO: this looks suspiciously like a reducer, maybe some of it belongs in the state instead?
export default function (watcher: Watcher) {
  watcher.on(actions.registerQuery, async (store, action) => {
    const {loadId, query} = action.payload;
    queryRegister[loadId] = query;
    await runQueries(store, watcher);
  });

  watcher.on(actions.liberateQuery, async (store, action) => {
    const {loadId} = action.payload;
    delete queryRegister[loadId];
    await runQueries(store, watcher);
  });
}
